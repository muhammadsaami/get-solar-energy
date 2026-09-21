import React from 'react'

function SettingsPageHeaderComponent() {
  return (
    <div className="tab-header-block">
      <h2 className="tab-heading">Dashboard Configurations</h2>
      <p className="tab-subheading">
        Configure device-level utility defaults and tariff parameters. Edit personal details on the Profile page.
      </p>
    </div>
  )
}

export const SettingsPageHeader = React.memo(SettingsPageHeaderComponent)
