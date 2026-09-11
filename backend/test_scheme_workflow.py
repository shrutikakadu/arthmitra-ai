import sys
import os
import io

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, User, SchemeApplication, Document, create_tables

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("Running ArthMitra Scheme Application Workflow Test Suite")
    print("==========================================================")

    db = SessionLocal()
    try:
        create_tables()

        # Find or create citizen user
        user1 = db.query(User).filter(User.role == "user").first()
        if not user1:
            print("ERROR: Demo user not found in database.")
            return False

        # Find or create a second user (for unauthorized access test)
        user2 = db.query(User).filter(User.role == "clerk").first()
        if not user2:
            print("ERROR: Clerk user not found in database.")
            return False

        user1_id = user1.id
        user2_id = user2.id

        print(f"Citizen User: {user1.name} (ID #{user1_id})")
        print(f"Other User: {user2.name} (ID #{user2_id})")

        # -------------------------------------------------------------
        # TEST 1: Upload Aadhaar without applying -> no scheme verification task
        # -------------------------------------------------------------
        print("\n--- TEST 1: Standalone Upload Without Applying ---")
        dummy_file = io.BytesIO(b"dummy aadhaar file content")
        res1 = client.post(
            "/api/documents/upload",
            data={"user_id": user1_id, "doc_type": "aadhaar"},
            files={"file": ("my_aadhaar.pdf", dummy_file, "application/pdf")}
        )
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
        data1 = res1.json()
        doc1 = data1["document"]
        assert doc1["application_id"] is None, f"Expected None application_id, got {doc1['application_id']}"
        assert doc1["status"] == "uploaded", f"Expected 'uploaded' status, got {doc1['status']}"
        assert doc1["status"] != "pending_clerk", "Standalone document must NOT have pending_clerk status!"

        # Verify clerk's pending document queue does NOT contain this standalone document
        all_docs_res = client.get("/api/documents/all")
        assert all_docs_res.status_code == 200
        all_docs = all_docs_res.json()
        doc1_in_all = next((d for d in all_docs if d["id"] == doc1["id"]), None)
        assert doc1_in_all is not None
        assert doc1_in_all["application_id"] is None
        assert doc1_in_all["status"] != "pending_clerk"

        # Verify clerk cannot verify an unlinked document
        verify_attempt = client.put(f"/api/documents/{doc1['id']}/verify?action=verified&admin_id={user2_id}")
        assert verify_attempt.status_code == 400, f"Expected 400 when verifying unlinked doc, got {verify_attempt.status_code}"
        print("  PASS: Uploaded Aadhaar without applying -> stored in profile locker, status is 'uploaded', no clerk verification task created.")

        # -------------------------------------------------------------
        # TEST 2: Apply for a scheme + upload Aadhaar -> Aadhaar linked to that application
        # -------------------------------------------------------------
        print("\n--- TEST 2: Apply for Scheme + Upload Aadhaar Linked to Application ---")
        unique_scheme_1 = f"PM Kisan Samman Nidhi Test {os.getpid()}"
        apply_res1 = client.post(
            "/api/applications/apply",
            json={
                "user_id": user1_id,
                "scheme_name": unique_scheme_1,
                "category": "Farmer",
                "benefit": "₹6,000/year",
                "reason_for_applying": "Cultivable landholder test"
            }
        )
        assert apply_res1.status_code == 200, f"Apply failed: {apply_res1.text}"
        app1_data = apply_res1.json()
        app1_id = app1_data["application_id"]
        assert app1_id is not None
        assert app1_data["status_code"] == "draft"

        # Upload Aadhaar linked to app1_id
        dummy_file2 = io.BytesIO(b"aadhaar card for scheme 1")
        upload_app1_res = client.post(
            "/api/documents/upload",
            data={"user_id": user1_id, "doc_type": "aadhaar", "application_id": app1_id},
            files={"file": ("kisan_aadhaar.pdf", dummy_file2, "application/pdf")}
        )
        assert upload_app1_res.status_code == 200, f"Upload to app failed: {upload_app1_res.text}"
        doc_app1_data = upload_app1_res.json()["document"]
        assert doc_app1_data["application_id"] == app1_id, f"Expected application_id {app1_id}, got {doc_app1_data['application_id']}"
        assert doc_app1_data["status"] == "draft", f"Expected 'draft' status before submission, got {doc_app1_data['status']}"
        print(f"  PASS: Application #{app1_id} created in draft, Aadhaar uploaded with application_id={app1_id}.")

        # -------------------------------------------------------------
        # TEST 3: Upload multiple documents -> all linked to same application
        # -------------------------------------------------------------
        print("\n--- TEST 3: Upload Multiple Documents to Same Application ---")
        dummy_file3 = io.BytesIO(b"land record for scheme 1")
        upload_app1_doc2 = client.post(
            "/api/documents/upload",
            data={"user_id": user1_id, "doc_type": "land_record", "application_id": app1_id},
            files={"file": ("7_12_land_record.pdf", dummy_file3, "application/pdf")}
        )
        assert upload_app1_doc2.status_code == 200
        doc_app1_doc2 = upload_app1_doc2.json()["document"]
        assert doc_app1_doc2["application_id"] == app1_id

        # Query single application endpoint
        app1_fetch = client.get(f"/api/applications/{app1_id}")
        assert app1_fetch.status_code == 200
        app1_fetched_docs = app1_fetch.json()["documents"]
        doc_types = [d["doc_type"] for d in app1_fetched_docs]
        assert "aadhaar" in doc_types, "Aadhaar should be in attached documents"
        assert "land_record" in doc_types, "Land record should be in attached documents"
        for d in app1_fetched_docs:
            assert d["application_id"] == app1_id, f"Expected doc application_id {app1_id}, got {d['application_id']}"
        print(f"  PASS: Multiple documents (Aadhaar & Land Record) successfully attached to Application #{app1_id}.")

        # -------------------------------------------------------------
        # TEST 4: Submit -> clerk receives the application with its documents
        # -------------------------------------------------------------
        print("\n--- TEST 4: Review and Submit Application to Clerk ---")
        # Submit application
        submit_res = client.post(f"/api/applications/{app1_id}/submit", json={"user_id": user1_id})
        assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
        submit_data = submit_res.json()
        assert submit_data["app_status"] == "pending_clerk", f"Expected pending_clerk, got {submit_data['app_status']}"

        # Clerk checks all applications
        clerk_apps_res = client.get("/api/applications/all")
        assert clerk_apps_res.status_code == 200
        all_apps = clerk_apps_res.json()
        submitted_app = next((a for a in all_apps if a["id"] == app1_id), None)
        assert submitted_app is not None, f"Application #{app1_id} not found in all applications!"
        assert submitted_app["status"] == "pending_clerk"
        assert submitted_app["current_handler"] == "Local Admin (Clerk)"
        assert len(submitted_app["documents"]) == 2, f"Expected 2 documents, got {len(submitted_app['documents'])}"
        for d in submitted_app["documents"]:
            assert d["status"] == "pending_clerk", f"Attached doc status should be pending_clerk, got {d['status']}"
        print(f"  PASS: Application #{app1_id} submitted. Clerk receives application in 'pending_clerk' with all attached documents.")

        # -------------------------------------------------------------
        # TEST 5: Two applications -> documents remain separated
        # -------------------------------------------------------------
        print("\n--- TEST 5: Two Applications with Separated Documents ---")
        unique_scheme_2 = f"Ayushman Bharat Test {os.getpid()}"
        apply_res2 = client.post(
            "/api/applications/apply",
            json={
                "user_id": user1_id,
                "scheme_name": unique_scheme_2,
                "category": "Health",
                "benefit": "₹5 Lakhs medical coverage",
                "reason_for_applying": "Health assurance test"
            }
        )
        assert apply_res2.status_code == 200
        app2_id = apply_res2.json()["application_id"]
        assert app2_id != app1_id, "Applications must have distinct IDs"

        # Upload Ration Card to Application 2
        dummy_file4 = io.BytesIO(b"ration card for scheme 2")
        upload_app2 = client.post(
            "/api/documents/upload",
            data={"user_id": user1_id, "doc_type": "ration_card", "application_id": app2_id},
            files={"file": ("bpl_ration_card.pdf", dummy_file4, "application/pdf")}
        )
        assert upload_app2.status_code == 200
        doc_app2 = upload_app2.json()["document"]
        assert doc_app2["application_id"] == app2_id

        # Submit Application 2
        client.post(f"/api/applications/{app2_id}/submit", json={"user_id": user1_id})

        # Verify separation in both applications
        app1_verify = client.get(f"/api/applications/{app1_id}").json()
        app2_verify = client.get(f"/api/applications/{app2_id}").json()

        app1_doc_ids = [d["id"] for d in app1_verify["documents"]]
        app2_doc_ids = [d["id"] for d in app2_verify["documents"]]

        # Ensure no overlap
        assert set(app1_doc_ids).isdisjoint(set(app2_doc_ids)), "Documents from different applications must NEVER mix!"
        assert all(d["application_id"] == app1_id for d in app1_verify["documents"])
        assert all(d["application_id"] == app2_id for d in app2_verify["documents"])
        print(f"  PASS: Documents for Application #{app1_id} and #{app2_id} remain completely separated.")

        # -------------------------------------------------------------
        # TEST 6: Unauthorized user cannot attach documents to another user's application
        # -------------------------------------------------------------
        print("\n--- TEST 6: Unauthorized User Access Prevention ---")
        dummy_file5 = io.BytesIO(b"malicious unauthorized file")
        unauth_upload = client.post(
            "/api/documents/upload",
            data={"user_id": user2_id, "doc_type": "pan_card", "application_id": app1_id},
            files={"file": ("unauthorized_doc.pdf", dummy_file5, "application/pdf")}
        )
        assert unauth_upload.status_code == 403, f"Expected 403 Forbidden, got {unauth_upload.status_code}: {unauth_upload.text}"
        assert "permission" in unauth_upload.text.lower() or "forbidden" in unauth_upload.text.lower()
        print(f"  PASS: Unauthorized user (ID #{user2_id}) blocked from attaching documents to Application #{app1_id} owned by User #{user1_id} (HTTP 403 Forbidden).")

        # -------------------------------------------------------------
        # TEST 7 (Bonus): Clerk Document Verification & Application Status Progression
        # -------------------------------------------------------------
        print("\n--- BONUS TEST: Clerk Document Verification & Status Sync ---")
        # Verify first document of app1
        doc_to_verify_1 = app1_verify["documents"][0]
        v_res1 = client.put(f"/api/documents/{doc_to_verify_1['id']}/verify?action=verified&admin_id={user2_id}")
        assert v_res1.status_code == 200, f"Verify failed: {v_res1.text}"

        # Verify second document of app1 -> all docs verified -> app transitions to pending_district
        doc_to_verify_2 = app1_verify["documents"][1]
        v_res2 = client.put(f"/api/documents/{doc_to_verify_2['id']}/verify?action=verified&admin_id={user2_id}")
        assert v_res2.status_code == 200, f"Verify failed: {v_res2.text}"

        # Check updated application status
        app1_after = client.get(f"/api/applications/{app1_id}").json()
        assert app1_after["status"] == "pending_district", f"Expected pending_district, got {app1_after['status']}"
        assert app1_after["current_handler"] == "District Officer / DM"
        print(f"  PASS: All documents verified by Clerk -> Application #{app1_id} automatically advanced to 'pending_district' (District Officer / DM).")

        print("\n==========================================================")
        print("ALL 6 REQUIRED WORKFLOW TESTS PASSED SUCCESSFULLY! \u2705")
        print("==========================================================")
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
