import React from 'react'
import type { HiringCompany } from '../types/jobMarketplace.types'
import { MdVerified, MdStar, MdLocationOn, MdWork, MdAccessTime, MdPeople, MdChevronRight } from 'react-icons/md'
import { useNotificationStore } from '../../../stores/notificationStore'

interface HiringCompaniesProps {
  companies: HiringCompany[]
}

export default function HiringCompanies({ companies }: HiringCompaniesProps) {
  const addToast = useNotificationStore((s) => s.addToast)
  return (
    <div className="job-companies-container">
      <h3 className="job-companies-heading">
        Verified Top EPC Solar Hiring Vendors
      </h3>

      <div className="job-companies-grid">
        {companies.map(comp => (
          <div key={comp.id} className="job-company-card">
            <div className="job-company-logo-box">
              {comp.logo}
            </div>

            <div className="job-company-details">
              <div className="job-company-card-title">
                {comp.name} {comp.verified ? <MdVerified className="job-verified-icon" /> : null}
              </div>

              <div className="job-company-meta-row">
                <span className="job-company-meta-item">
                  <MdLocationOn className="job-meta-icon-blue" /> {comp.city}
                </span>
                <span className="job-company-meta-item">
                  <MdStar className="job-meta-icon-orange" /> {comp.rating}
                </span>
                <span className="job-company-meta-item">
                  <MdPeople className="job-meta-icon-purple" /> {comp.companySize}
                </span>
                <span className="job-company-meta-item">
                  <MdAccessTime className="job-meta-icon-gray" /> Resp: {comp.responseTime}
                </span>
              </div>

              <div className="job-company-footer-row">
                <span className="job-company-open-jobs">
                  <MdWork /> {comp.openJobsCount} Open Positions
                </span>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => addToast({ type: 'info', message: `Viewing vendor profile for ${comp.name}` })}
                >
                  Quick View <MdChevronRight />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
