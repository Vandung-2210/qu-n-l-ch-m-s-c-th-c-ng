async function test() {
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@petcare.ai", password: "Admin@123456" })
  });
  const loginData = await loginRes.json();
  console.log("Login success:", Boolean(loginData.token));
  
  const slotRes = await fetch("http://localhost:5000/api/data/appointments/slot-availability?date=2026-10-24&petId=pet-1792128958474&facility=" + encodeURIComponent("Bệnh viện Thú y PetHealth 262 Quang Trung"), {
    headers: { "Authorization": `Bearer ${loginData.token}` }
  });
  const slotData = await slotRes.json();
  console.log("Slot availability result:\n", JSON.stringify(slotData, null, 2));
}
test();
