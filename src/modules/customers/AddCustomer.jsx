import React, { useState } from "react";
import { useCustomersData } from "../../hooks/useCustomersData";
import AppModal from "../../components/common/AppModal";
import BackIcon from "../../components/common/BackIcon";

function AddCustomer({ mode, onBack, onCustomerAdded }) {
  const { addCustomer, getCustomerByMobile } = useCustomersData();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [modal, setModal] = useState(null);

  const handleSave = () => {
    if (!name.trim()) {
      setModal({ type: "warning", title: "Name Required", message: "Please enter customer name.", onConfirm: () => setModal(null) });
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      setModal({ type: "warning", title: "Mobile Required", message: "Please enter a valid 10-digit mobile number.", onConfirm: () => setModal(null) });
      return;
    }
    const existing = getCustomerByMobile(mobile.trim());
    if (existing) {
      setModal({ type: "warning", title: "Already Exists", message: "Customer with mobile " + mobile + " already exists: " + existing.name, onConfirm: () => setModal(null) });
      return;
    }
    addCustomer({ name: name.trim(), mobile: mobile.trim(), address: address.trim() });
    setModal({
      type: "success",
      title: "Customer Added",
      message: name + " has been added successfully.",
      onConfirm: () => {
        setModal(null);
        onCustomerAdded ? onCustomerAdded() : onBack();
      },
    });
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      {modal && <AppModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} confirmLabel="OK" />}

      {/* Header — back arrow inline with title */}
      <div className="page-header-row" style={{ marginBottom: 12 }}>
        <span className="back-arrow-gradient" onClick={onBack}>
          <BackIcon size={20} strokeWidth={3} />
        </span>
        <div className="page-title-pill" style={{ flex: 1, textAlign: "center" }}>
          New Customer
        </div>
      </div>

      <section style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#334155",
            padding: "3px 8px",
            background: "#0a0f18",
            borderRadius: 4,
            borderLeft: "2px solid #00b4d8",
            marginBottom: 8,
          }}
        >
          Customer Details
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input className="input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Mobile Number (10 digits)" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <input className="input" placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </section>

      <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSave}>
        Save Customer
      </button>
    </div>
  );
}

export default AddCustomer;
