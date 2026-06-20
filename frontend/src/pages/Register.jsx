import { Link, useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();

        alert("Registered Successfully");
        navigate("/");
    };

    return (
        <div style={{ padding: "40px", maxWidth: "400px", margin: "auto" }}>
            <h2>Register</h2>

            <form onSubmit={handleRegister}>
                <input
                    placeholder="Name"
                    style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                />

                <input
                    placeholder="Email"
                    style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                />

                <button type="submit">
                    Register
                </button>
            </form>

            <p>
                Already have account? <Link to="/">Login</Link>
            </p>
        </div>
    );
}

export default Register;