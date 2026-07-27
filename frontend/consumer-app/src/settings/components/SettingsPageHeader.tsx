import React from 'react'

function SettingsPageHeaderComponent() {
  return (
    <div className="tab-header-block">
      <h2 className="tab-heading">Dashboard Configurations</h2>
      <p className="tab-subheading">
        Configure system values, load preferences, tariff parameters, and profile details.
      </p>
    </div>
  )
}

export const SettingsPageHeader = React.memo(SettingsPageHeaderComponent)
