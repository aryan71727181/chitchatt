import { useState, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteRoomModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteRoomModal({ roomId, roomName, onClose, onDeleted }: DeleteRoomModalProps) {
  const [input, setInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedInput = input.trim();
  const isConfirmed = trimmedInput === roomName;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    setIsDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Room deleted");
    onDeleted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm glass-strong rounded-3xl border border-red-500/20 p-6 animate-scale-in shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 grid place-items-center text-muted-foreground hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Warning icon */}
        <div className="h-14 w-14 rounded-2xl bg-red-500/15 border border-red-500/25 grid place-items-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <h3 className="text-lg font-bold text-center">Delete Room?</h3>
        <p className="text-sm text-muted-foreground text-center mt-1.5 leading-relaxed">
          This will permanently delete <span className="text-white font-semibold">{roomName}</span> and all its messages, members, and seats. This action <span className="text-red-400 font-semibold">cannot be undone</span>.
        </p>

        {/* Safety check */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-muted-foreground block mb-2">
            Type <span className="text-white font-bold">"{roomName}"</span> to confirm
          </label>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type "${roomName}" here`}
            className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-sm outline-none focus:border-red-500/50 transition-colors placeholder:text-white/20"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && isConfirmed) handleDelete();
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl glass text-sm font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className={`flex-1 h-11 rounded-xl text-sm font-bold active:scale-95 transition-all ${
              isConfirmed && !isDeleting
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-red-500/30 text-red-300/60 cursor-not-allowed"
            }`}
          >
            {isDeleting ? "Deleting…" : "Delete Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
