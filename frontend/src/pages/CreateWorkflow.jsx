import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";

function CreateWorkflow() {

  const [name, setName] = useState("");
  const navigate = useNavigate();

  const createWorkflow = async () => {

    if (!name) {
      alert("Workflow name required");
      return;
    }

    try {

      const res = await api.post("/workflows", {
        name
      });

      navigate("/dashboard");

    } catch (err) {

      console.error(err);
      alert("Failed to create workflow");

    }

  };

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-6">
        Create Workflow
      </h1>

      <div className="bg-slate-800 p-6 rounded-xl w-96">

        <input
          placeholder="Workflow Name"
          className="w-full p-3 mb-4 bg-slate-700 rounded"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <button
          onClick={createWorkflow}
          className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700"
        >
          Create
        </button>

      </div>

    </DashboardLayout>

  );

}

export default CreateWorkflow;