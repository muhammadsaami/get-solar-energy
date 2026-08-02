import React from 'react'
import type { SkillMatrixItem } from '../types/certifications.types'
import { MdCheckCircle, MdLock } from 'react-icons/md'

interface SkillMatrixGridProps {
  skills: SkillMatrixItem[]
}

export default function SkillMatrixGrid({ skills }: SkillMatrixGridProps) {
  if (!skills || skills.length === 0) {
    return (
      <div style={{ background: 'rgba(8, 24, 42, 0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
          Field Skill Competency Matrix
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Skill matrix data will populate dynamically once additional backend endpoints are available.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(8, 24, 42, 0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>
        Field Skill Competency Matrix
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {skills.map(skill => (
          <div
            key={skill.id}
            style={{
              background: skill.isAcquired ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${skill.isAcquired ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{skill.category}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: skill.isAcquired ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: skill.isAcquired ? '#10b981' : '#94a3b8' }}>
                {skill.requiredLevel}
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {skill.isAcquired ? <MdCheckCircle style={{ color: '#10b981' }} /> : <MdLock style={{ color: '#64748b' }} />}
              {skill.skillName}
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Proficiency</span>
                <span style={{ color: skill.isAcquired ? '#10b981' : '#64748b' }}>{skill.proficiencyPercent}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${skill.proficiencyPercent}%`,
                    background: skill.isAcquired ? 'linear-gradient(90deg, #10b981, #00aeef)' : '#64748b',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
