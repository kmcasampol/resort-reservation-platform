"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { AccommodationData } from "@/types";
import {
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
} from "@/actions/admin";
import {
  Plus,
  Pencil,
  Users,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

interface AccommodationsClientProps {
  initialAccommodations: AccommodationData[];
}

type UnitDraft = {
  name: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  imageUrl: string;
  description: string;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80";

function toDraft(item: AccommodationData): UnitDraft {
  return {
    name: item.name,
    type: item.type,
    pricePerNight: item.pricePerNight,
    capacity: item.capacity,
    imageUrl: item.imageUrl,
    description: item.description,
  };
}

/** Shared create/edit form — one implementation, two submission targets. */
function UnitForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  draft: UnitDraft;
  setDraft: (next: UnitDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const patch = (partial: Partial<UnitDraft>) => setDraft({ ...draft, ...partial });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="unit-name" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
          Unit Name *
        </label>
        <input
          id="unit-name"
          type="text"
          placeholder="e.g. Sunset Royal Villa"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          required
          minLength={3}
          maxLength={80}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="unit-type" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
            Type
          </label>
          <select
            id="unit-type"
            value={draft.type}
            onChange={(e) => patch({ type: e.target.value })}
            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="VILLA">Villa</option>
            <option value="COTTAGE">Cottage</option>
            <option value="ROOM">Room / Suite</option>
          </select>
        </div>

        <div>
          <label htmlFor="unit-price" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
            Price / Night (₱)
          </label>
          <input
            id="unit-price"
            type="number"
            value={draft.pricePerNight}
            min={0}
            max={1000000}
            onChange={(e) => patch({ pricePerNight: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            required
          />
        </div>

        <div>
          <label htmlFor="unit-capacity" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
            Max Capacity
          </label>
          <input
            id="unit-capacity"
            type="number"
            value={draft.capacity}
            min={1}
            max={100}
            onChange={(e) => patch({ capacity: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="unit-image" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
          Photo URL
        </label>
        <input
          id="unit-image"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={draft.imageUrl}
          onChange={(e) => patch({ imageUrl: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
        />
      </div>

      <div>
        <label htmlFor="unit-desc" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
          Description
        </label>
        <textarea
          id="unit-desc"
          rows={3}
          placeholder="Details on furnishings, views, beds, etc."
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none"
          required
          minLength={10}
          maxLength={600}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}

function ModalShell({
  title,
  onClose,
  error,
  children,
}: {
  title: string;
  onClose: () => void;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-500 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default function AccommodationsClient({
  initialAccommodations,
}: AccommodationsClientProps) {
  const [accommodations, setAccommodations] = useState(initialAccommodations);
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AccommodationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const emptyDraft: UnitDraft = {
    name: "",
    type: "VILLA",
    pricePerNight: 5000,
    capacity: 4,
    imageUrl: "",
    description: "",
  };

  const [createDraft, setCreateDraft] = useState<UnitDraft>(emptyDraft);
  const [updateDraft, setUpdateDraft] = useState<UnitDraft>(emptyDraft);

  const openEdit = (item: AccommodationData) => {
    setDeleteError(null);
    setEditError(null);
    setUpdateDraft(toDraft(item));
    setEditTarget(item);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditError(null);
  };

  const handleCreate = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createAccommodation({
        ...createDraft,
        imageUrl: createDraft.imageUrl || DEFAULT_IMAGE,
      });

      if (res.success && res.accommodation) {
        setAccommodations((prev) => [...prev, res.accommodation as AccommodationData]);
        setShowAddModal(false);
        setCreateDraft(emptyDraft);
      } else {
        setErrorMsg(res.error || "Failed to create unit.");
      }
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    setEditError(null);
    startTransition(async () => {
      const res = await updateAccommodation(editTarget.id, updateDraft);

      if (res.success) {
        setAccommodations((prev) =>
          prev.map((a) =>
            a.id === editTarget.id
              ? {
                  ...a,
                  ...updateDraft,
                  imageUrl: updateDraft.imageUrl || DEFAULT_IMAGE,
                }
              : a
          )
        );
        closeEdit();
      } else {
        setEditError(res.error || "Failed to update unit.");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE";
    startTransition(async () => {
      const res = await updateAccommodation(id, { status: nextStatus });
      if (res.success) {
        setAccommodations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
        );
      } else {
        setDeleteError(res.error || "Failed to change status.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    setDeleteError(null);

    startTransition(async () => {
      const res = await deleteAccommodation(id);
      if (res.success) {
        setAccommodations((prev) => prev.filter((a) => a.id !== id));
      } else {
        setDeleteError(res.error || "Cannot delete accommodation with active bookings.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-600 font-semibold">
            Total Inventory: {accommodations.length} Units
          </span>
        </div>
        <button
          onClick={() => {
            setDeleteError(null);
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Accommodation
        </button>
      </div>

      {deleteError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {deleteError}
        </div>
      )}

      {/* Grid of accommodations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                <Image
                  src={item.imageUrl || DEFAULT_IMAGE}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-2xs font-bold uppercase bg-white/90 text-slate-800 backdrop-blur-md">
                    {item.type}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-2xs font-bold uppercase ${
                      item.status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h2 className="font-bold text-slate-900 text-base">{item.name}</h2>
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" /> Max {item.capacity} Guests
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₱{item.pricePerNight.toLocaleString()}{" "}
                    <span className="text-2xs font-normal text-slate-500">/ night</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleStatus(item.id, item.status)}
                disabled={isPending}
                className="grow px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-2xs transition-colors cursor-pointer"
              >
                {item.status === "AVAILABLE" ? "Set to Maintenance" : "Set to Available"}
              </button>

              <button
                onClick={() => openEdit(item)}
                disabled={isPending}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Edit unit"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete unit"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {accommodations.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No accommodations yet. Add your first unit to start taking reservations.
        </div>
      )}

      {/* Add Accommodation Modal */}
      {showAddModal && (
        <ModalShell
          title="Add New Accommodation"
          onClose={() => {
            setShowAddModal(false);
            setErrorMsg(null);
          }}
          error={errorMsg}
        >
          <UnitForm
            draft={createDraft}
            setDraft={setCreateDraft}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowAddModal(false);
              setErrorMsg(null);
            }}
            isPending={isPending}
            submitLabel="Save Accommodation"
          />
        </ModalShell>
      )}

      {/* Edit Accommodation Modal */}
      {editTarget && (
        <ModalShell title={`Edit — ${editTarget.name}`} onClose={closeEdit} error={editError}>
          <UnitForm
            draft={updateDraft}
            setDraft={setUpdateDraft}
            onSubmit={handleUpdate}
            onCancel={closeEdit}
            isPending={isPending}
            submitLabel="Update Accommodation"
          />
        </ModalShell>
      )}
    </div>
  );
}
