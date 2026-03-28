import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, Building2 } from 'lucide-react';
import { getOrganizations, createOrganization, deleteOrganization } from '../lib/services';
import type { Organization } from '../lib/types';
import { validateDomain, cleanDomain } from '../lib/types';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';

export default function Organizations() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [rootDomain, setRootDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);

  useEffect(() => { loadOrgs(); }, []);

  async function loadOrgs() {
    setIsLoading(true);
    try {
      setOrgs(await getOrganizations());
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }

  // Real-time domain validation as user types
  function handleDomainChange(value: string) {
    setRootDomain(value);
    if (value.trim()) {
      const err = validateDomain(value);
      setDomainError(err ?? '');
    } else {
      setDomainError('');
    }
  }

  // Auto-clean domain on paste (strips https://, paths)
  function handleDomainPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const cleaned = cleanDomain(pasted);
    setRootDomain(cleaned);
    const err = validateDomain(cleaned);
    setDomainError(err ?? '');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const err = validateDomain(rootDomain);
    if (err) { setDomainError(err); return; }

    setIsSaving(true);
    try {
      const org = await createOrganization(name.trim(), cleanDomain(rootDomain));
      setOrgs((prev) => [...prev, org]);
      setShowModal(false);
      setName('');
      setRootDomain('');
      setDomainError('');
      toast.success(`${org.name} added successfully`);
    } catch {
      toast.error('Failed to create organization');
    } finally {
      setIsSaving(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setName('');
    setRootDomain('');
    setDomainError('');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteOrganization(deleteTarget.id);
      setOrgs((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} deleted`);
    } catch {
      toast.error('Failed to delete organization');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Organizations
        </h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Organization
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : orgs.length === 0 ? (
        <div className="rounded-xl" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <EmptyState
            icon={Building2}
            title="No organizations yet"
            description="Add a company domain to start scanning its public infrastructure."
            action={{ label: 'Add Organization', onClick: () => setShowModal(true) }}
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          {orgs.map((org, i) => (
            <div
              key={org.id}
              className="flex items-center justify-between px-6 py-4 transition-colors"
              style={{
                borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              {/* Org info */}
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/organizations/${org.id}/assets`)}
              >
                <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                  {org.name}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <ExternalLink className="h-3 w-3" />
                  {org.rootDomain}
                </div>
              </div>

              {/* Meta + actions */}
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Added {new Date(org.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setDeleteTarget(org)}
                  className="p-1.5 rounded-md cursor-pointer transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-danger)';
                    e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Org Modal */}
      <Modal open={showModal} onClose={closeModal} title="Add Organization">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="org-name"
            label="Organization Name"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="root-domain"
            label="Root Domain"
            placeholder="acme.com"
            value={rootDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            onPaste={handleDomainPaste}
            error={domainError}
            required
          />
          {!domainError && rootDomain && (
            <p className="text-xs -mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Tip: paste a full URL — we'll clean it automatically
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="submit" isLoading={isSaving} disabled={!!domainError} className="flex-1">
              Add Organization
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Organization"
        description={`This will permanently delete "${deleteTarget?.name}" and all its scan data. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
