"use client";

import { useState } from "react";
import { Users, Trash2, UserX, CheckSquare, Square } from "lucide-react";

const BulkUserActions = ({
  users,
  onBulkAction,
  selectedUsers,
  onSelectionChange,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState("");

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(users.map((user) => user.id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) return;

    setActionType(action);
    setShowConfirm(true);
  };

  const confirmAction = () => {
    onBulkAction(actionType, selectedUsers);
    setShowConfirm(false);
    setActionType("");
    onSelectionChange([]);
  };

  const getActionText = () => {
    switch (actionType) {
      case "delete":
        return `delete ${selectedUsers.length} user(s)`;
      case "deactivate":
        return `deactivate ${selectedUsers.length} user(s)`;
      default:
        return "";
    }
  };

  if (users.length === 0) return null;

  return (
    <>
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              {selectedUsers.length === users.length ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm">
                {selectedUsers.length === users.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>

            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                <span>{selectedUsers.length} selected</span>
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-all text-sm"
              >
                <UserX className="w-4 h-4" />
                Deactivate
              </button>

              <button
                onClick={() => handleBulkAction("delete")}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirm Action
            </h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to {getActionText()}? This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkUserActions;
