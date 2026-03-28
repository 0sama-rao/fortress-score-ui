import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { getOrganizations, createOrganization, deleteOrganization } from '../lib/services';
import type { Organization } from '../lib/types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

export default function Organizations() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [rootDomain, setRootDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    setIsLoading(true);
    try {
      const data = await getOrganizations();
      setOrgs(data);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const org = await createOrganization(name, rootDomain);
      setOrgs((prev) => [...prev, org]);
      setShowModal(false);
      setName('');
      setRootDomain('');
    } catch {
      setError('Failed to create organization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOrganization(id);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
      setDeleteConfirm(null);
    } catch {
      //
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Organizations</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Organization
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">No organizations added yet.</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Your First Organization
          </Button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          {orgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between px-6 py-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/organizations/${org.id}/assets`)}
              >
                <div className="font-medium text-text">{org.name}</div>
                <div className="text-sm text-text-secondary flex items-center gap-1 mt-0.5">
                  <ExternalLink className="h-3 w-3" />
                  {org.rootDomain}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">
                  Added {new Date(org.createdAt).toLocaleDateString()}
                </span>
                {deleteConfirm === org.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-danger">Delete?</span>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => handleDelete(org.id)}>
                      Yes
                    </Button>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setDeleteConfirm(null)}>
                      No
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(org.id)}
                    className="p-2 text-text-secondary hover:text-danger transition-colors cursor-pointer rounded-md hover:bg-danger-light"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Org Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 className="text-lg font-semibold text-text mb-5">Add Organization</h2>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
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
                onChange={(e) => setRootDomain(e.target.value)}
                required
              />
              <div className="flex gap-3 pt-1">
                <Button type="submit" isLoading={isSaving} className="flex-1">
                  Add Organization
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
