import { useNavigate } from "react-router-dom";

function WorkflowCard({ workflow }) {

  const navigate = useNavigate();

  return (

    <div className="bg-slate-800 p-6 rounded-xl shadow hover:shadow-xl transition">

      <h2 className="text-xl font-semibold mb-2">
        {workflow.name}
      </h2>

      <p className="text-slate-400 text-sm">
        Trigger: {workflow.trigger_type || "Webhook"}
      </p>

      <p className="text-slate-400 text-sm mb-4">
        Created: {new Date(workflow.created_at).toLocaleDateString()}
      </p>

      <button
        onClick={() => navigate(`/workflow/${workflow.id}`)}
        className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700"
      >
        Open Workflow
      </button>

    </div>

  );

}

export default WorkflowCard;