async function test() {
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@petcare.ai", password: "Admin@123456" })
  });
  const { token } = await loginRes.json();
  
  console.log("\n--- THỬ ĐẶT LỊCH TRÙNG KHUNG GIỜ 14:00 (POST /api/data/appointments) ---");
  const collisionBookingRes = await fetch("http://localhost:5000/api/data/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      petId: "pet-1792128958474",
      petName: "Cún Kiểm Thử",
      date: "2026-10-24",
      time: "14:00",
      facility: "Bệnh viện Thú y PetHealth 262 Quang Trung",
      service: "Da liễu & Vết nấm/ve rận",
      ownerName: "Đinh Xuân Mạnh",
      phone: "0346823522"
    })
  });
  const resData = await collisionBookingRes.json();
  console.log("Status HTTP:", collisionBookingRes.status);
  console.log("Response Body:", JSON.stringify(resData, null, 2));
}
test();
