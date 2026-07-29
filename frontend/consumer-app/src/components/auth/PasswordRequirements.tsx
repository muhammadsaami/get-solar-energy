interface Requirement {
  key: string
  label: string
  met: boolean
}

interface PasswordRequirementsProps {
  requirements: Requirement[]
}

export default function PasswordRequirements({ requirements }: PasswordRequirementsProps) {
  return (
    <div className="pwd-requirement-box">
      <div className="pwd-requirement-title">Password Requirements:</div>
      <ul className="pwd-requirement-list">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={`pwd-req-item ${req.met ? 'valid' : 'invalid'}`}
          >
            <span className="pwd-req-icon">{req.met ? '\u2713' : '\u2715'}</span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
