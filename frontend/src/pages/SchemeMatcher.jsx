import API from "../api/axios";

function SchemeMatcher() {

    const testAPI = async () => {
        try {
            const res = await API.post("/match-schemes", {});
            alert(JSON.stringify(res.data));
        } catch (err) {
            console.error(err);
            alert("API Error");
        }
    };

    return (
        <div style={{ padding: "40px" }}>
            <h1>Scheme Matcher</h1>

            <button onClick={testAPI}>
                Test Backend Connection
            </button>
        </div>
    );
}

export default SchemeMatcher;