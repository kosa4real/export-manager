"use client";
import { useState, useEffect } from "react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: "", contact: "" });

  async function fetchSuppliers() {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data);
  }

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function addSupplier() {
    await fetch("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });
    setForm({ name: "", contact: "" });
    fetchSuppliers();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Suppliers</h1>
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 mr-2 rounded"
      />
      <input
        type="text"
        placeholder="Contact"
        value={form.contact}
        onChange={(e) => setForm({ ...form, contact: e.target.value })}
        className="border p-2 mr-2 rounded"
      />
      <button
        onClick={addSupplier}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add Supplier
      </button>

      <ul className="mt-4">
        {suppliers.map((s) => (
          <li key={s.id}>
            {s.name} — {s.contact}
          </li>
        ))}
      </ul>
    </div>
  );
}
