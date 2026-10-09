"use client";

import { useState, useTransition } from "react";
import { AmenityData } from "@/types";
import { createAmenity, updateAmenity, deleteAmenity } from "@/actions/admin";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

interface AmenitiesClientProps {
  initialAmenities: AmenityData[];
}

type AmenityDraft = {
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  imageUrl: string;
};

const emptyDraft: AmenityDraft = {
  name: "",
  category: "ACTIVITY",
  price: 500,
  unit: "PER_PERSON",
  description: "",
  imageUrl: "",
};

function toDraft(item: AmenityData): AmenityDraft {
  return {
    name: item.name,
    category: item.category,
    price: item.price,
    unit: item.unit,
    description: item.description,
    imageUrl: item.imageUrl ?? "",
  };
}

function AmenityForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  draft: AmenityDraft;
  setDraft: (next: AmenityDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const patch = (partial: Partial<AmenityDraft>) => setDraft({ ...draft, ...partial });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="amenity-name" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
          Amenity / Package Name *
        </label>
        <input
          id="amenity-name"
          type="text"
          placeholder="e.g. Scuba Diving Expedition"
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
          <label htmlFor="amenity-category" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
            Category
          </label>
          <select
            id="amenity-category"
            value={draft.category}
            onChange={(e) => patch({ category: e.target.value })}
            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="ACTIVITY">Activity</option>
            <option value="POOL_PASS">Pool Pass</option>
            <option value="EVENT_HALL">Event Hall</option>
            <option value="FOOD_PACKAGE">Dining / Buffet</option>
          </select>
        </div>

        <div>
          <label htmlFor="amenity-price" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
            Price (₱)
          </label>
          <input
            id="amenity-price"
            type="number"
            value={draft.price}
            min={0}
            max={1000000}
            onChange={(e) => patch({ price: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            required
          />
        </div>

        <div>
          <label htmlFor="amenity-unit" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
            Billing Unit
          </label>
          <select
            id="amenity-unit"
            value={draft.unit}
            onChange={(e) => patch({ unit: e.target.value })}
            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="PER_PERSON">Per Person</option>
            <option value="PER_DAY">Per Day</option>
            <option value="PER_HOUR">Per Hour</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="amenity-image" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
          Photo URL (Optional)
        </label>
        <input
          id="amenity-image"
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={draft.imageUrl}
          onChange={(e) => patch({ imageUrl: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
        />
      </div>

      <div>
        <label htmlFor="amenity-desc" className="text-2xs font-bold text-slate-500 uppercase block mb-1">
          Description
        </label>
        <textarea
          id="amenity-desc"
          rows={3}
          placeholder="Inclusions, schedule, or restrictions..."
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

export default function AmenitiesClient({ initialAmenities }: AmenitiesClientProps) {
  const [amenities, setAmenities] = useState(initialAmenities);
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AmenityData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [createDraft, setCreateDraft] = useState<AmenityDraft>(emptyDraft);
  const [updateDraft, setUpdateDraft] = useState<AmenityDraft>(emptyDraft);

  const handleCreate = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createAmenity({
        ...createDraft,
        imageUrl: createDraft.imageUrl || undefined,
      });

      if (res.success && res.amenity) {
        setAmenities((prev) => [...prev, res.amenity as AmenityData]);
        setShowAddModal(false);
        setCreateDraft(emptyDraft);
      } else {
        setErrorMsg(res.error || "Failed to create amenity.");
      }
    });
  };

  const openEdit = (item: AmenityData) => {
    setDeleteError(null);
    setEditError(null);
    setUpdateDraft(toDraft(item));
    setEditTarget(item);
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    setEditError(null);
    startTransition(async () => {
      const res = await updateAmenity(editTarget.id, {
        ...updateDraft,
        imageUrl: updateDraft.imageUrl,
      });

      if (res.success) {
        setAmenities((prev) =>
          prev.map((a) =>
            a.id === editTarget.id
              ? { ...a, ...updateDraft, imageUrl: updateDraft.imageUrl || null }
              : a
          )
        );
        setEditTarget(null);
      } else {
        setEditError(res.error || "Failed to update amenity.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this amenity?")) return;
    setDeleteError(null);

    startTransition(async () => {
      const res = await deleteAmenity(id);
      if (res.success) {
        setAmenities((prev) => prev.filter((a) => a.id !== id));
      } else {
        setDeleteError(res.error || "Cannot delete amenity with active bookings.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-600 font-semibold">
            Total Amenities: {amenities.length} Services
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
          <Plus className="w-4 h-4" /> Add Resort Amenity
        </button>
      </div>

      {deleteError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {deleteError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {amenities.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  {item.category.replace("_", " ")}
                </span>
                <span className="text-sm font-bold text-slate-900 shrink-0">
                  ₱{item.price.toLocaleString()}{" "}
                  <span className="text-2xs font-normal text-slate-500">
                    / {item.unit.toLowerCase().replace("_", " ")}
                  </span>
                </span>
              </div>

              <div>
                <h2 className="font-bold text-slate-900 text-base">{item.name}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(item)}
                disabled={isPending}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Edit amenity"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Delete amenity"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {amenities.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No amenities yet. Add packages guests can attach to a reservation.
        </div>
      )}

      {/* Add Amenity Modal */}
      {showAddModal && (
        <ModalShell
          title="Add New Amenity / Package"
          onClose={() => {
            setShowAddModal(false);
            setErrorMsg(null);
          }}
          error={errorMsg}
        >
          <AmenityForm
            draft={createDraft}
            setDraft={setCreateDraft}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowAddModal(false);
              setErrorMsg(null);
            }}
            isPending={isPending}
            submitLabel="Save Amenity"
          />
        </ModalShell>
      )}

      {/* Edit Amenity Modal */}
      {editTarget && (
        <ModalShell
          title={`Edit — ${editTarget.name}`}
          onClose={() => {
            setEditTarget(null);
            setEditError(null);
          }}
          error={editError}
        >
          <AmenityForm
            draft={updateDraft}
            setDraft={setUpdateDraft}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditTarget(null);
              setEditError(null);
            }}
            isPending={isPending}
            submitLabel="Update Amenity"
          />
        </ModalShell>
      )}
    </div>
  );
}
