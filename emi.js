const API_URL = "http://localhost:3000/api";

async function addEMI(data) {
    const res = await fetch(`${API_URL}/emi`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await res.json();
}

async function getAllEMIs() {
    const res = await fetch(`${API_URL}/emi`);
    return await res.json();
}
