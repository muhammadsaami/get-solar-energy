import React from 'react';
import { MdEmail, MdWork } from 'react-icons/md';

export default function TeamTab({ project }) {
  const teamMembers = [
    { role: 'Project Engineer', member: project.assignedEngineer, color: 'var(--color-blue)' },
    { role: 'Lead Installer', member: project.assignedInstaller, color: 'var(--color-purple)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {teamMembers.map(({ role, member, color }) => (
        <div key={role} className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="avatar" style={{ background: color, width: '48px', height: '48px', fontSize: 'var(--font-size-lg)' }}>
              {member.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '2px' }}>{role}</div>
              <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                {member.name || 'Unassigned'}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdEmail size={12} /> {member.email || '-'}
                </span>
              </div>
            </div>
            <span className="badge badge-sm badge-neutral">{role === 'Project Engineer' ? 'Engineering' : 'Installation'}</span>
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          <MdWork style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Project Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>System Type</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{project.systemType}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Project Type</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{project.projectType}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lead Source</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{project.leadSource}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Since</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              {project.stageHistory.length > 0 ? new Date(project.stageHistory[0].enteredAt).toLocaleDateString('en-IN') : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
