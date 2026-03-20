import React, { useState } from "react";
import BackIcon from "../../components/common/BackIcon";

function CustomerHistory({ customer, orders, onBack, onUpdateCredit }) {
  const [editingLimit, setEditingLimit] = useState(false);
  const [newLimit, setNewLimit] = useState(customer.creditLimit);

  const customerOrders = orders.filter((o) => o.customerName === customer.name || o.customerId === customer.id);

  const totalCredit = customerOrders.filter((o) => o.paymentStatus === "credit").reduce((sum, o) => sum + (o.total || 0), 0);

  const totalPaid = customerOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.total || 0), 0);

  const handleSaveLimit = () => {
    onUpdateCredit(customer.id, parseFloat(newLimit) || 0);
    setEditingLimit(false);
  };

  return (
    <div className="p-3">
      <div className="d-flex align-items-center mb-3 gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={onBack}>
          <BackIcon size={16} strokeWidth={3} /> Back
        </button>
        <h5 className="mb-0">{customer.name}</h5>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="card text-center p-2">
            <div className="text-muted small">Total Orders</div>
            <div className="fw-bold">{customerOrders.length}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="card text-center p-2">
            <div className="text-muted small">Total Spent</div>
            <div className="fw-bold">₹{(totalPaid + totalCredit).toFixed(2)}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="card text-center p-2 border-danger">
            <div className="text-muted small">Credit Due</div>
            <div className="fw-bold text-danger">₹{totalCredit.toFixed(2)}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="card text-center p-2 border-success">
            <div className="text-muted small">Credit Limit</div>
            {editingLimit ? (
              <div className="d-flex gap-1 mt-1">
                <input type="number" className="form-control form-control-sm" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} />
                <button className="btn btn-sm btn-success" onClick={handleSaveLimit}>
                  ✓
                </button>
              </div>
            ) : (
              <div className="fw-bold text-success" onClick={() => setEditingLimit(true)} style={{ cursor: "pointer" }}>
                ₹{customer.creditLimit} ✏️
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-2 fw-semibold">📋 Order History</div>
      {customerOrders.length === 0 ? (
        <div className="text-muted small">No orders yet.</div>
      ) : (
        customerOrders
          .slice()
          .reverse()
          .map((o) => (
            <div key={o.id} className="card mb-2 p-2">
              <div className="d-flex justify-content-between">
                <span className="small fw-semibold">#{o.id}</span>
                <span className="small text-muted">{o.date}</span>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <span className="small">₹{(o.total || 0).toFixed(2)}</span>
                <span className={`badge ${o.paymentStatus === "paid" ? "bg-success" : o.paymentStatus === "credit" ? "bg-danger" : "bg-warning text-dark"}`}>{o.paymentStatus}</span>
              </div>
              {o.items && (
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {o.items.map((i) => i.name).join(", ")}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  );
}

export default CustomerHistory;
