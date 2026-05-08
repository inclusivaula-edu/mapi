import { useState } from "react";
import axios from "axios";

export default function Billing() {
  const [plan, setPlan] = useState("pro");

  async function handleSubscribe() {
    const res = await axios.post("http://localhost:3000/create-subscription", {
      plan,
      email: "teste@email.com",
    });

    window.location.href = res.data.link;
  }

  return (
    <div>
      <h1>💳 Billing</h1>

      <select onChange={(e) => setPlan(e.target.value)}>
        <option value="basic">Basic</option>
        <option value="pro">Pro</option>
        <option value="enterprise">Enterprise</option>
      </select>

      <button onClick={handleSubscribe}>
        Assinar Plano
      </button>
    </div>
  );
}