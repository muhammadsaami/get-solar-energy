export interface CustomerProfileData {
  id?: string
  name: string
  email: string
  phone: string
  city: string
  address: string
  consumerNumber?: string
  discom?: string
  sanctionedLoadKw?: string
  joinedDateFormatted: string
  accountType: 'Residential' | 'Commercial' | 'Industrial'
  kycStatus: 'Verified' | 'Pending' | 'In Review'
  subsidyEligible: boolean
}

export interface CustomerProfileUpdatePayload {
  name: string
  phone: string
  city: string
  address: string
  consumerNumber?: string
  discom?: string
  sanctionedLoadKw?: string
}
