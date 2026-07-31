import React, { useState, useEffect } from 'react'
import DashboardSprites from '../../components/dashboard/DashboardSprites'
import TrainingHero from './components/TrainingHero'
import TrainingKPIs from './components/TrainingKPIs'
import ContinueLearning from './components/ContinueLearning'
import LearningPaths from './components/LearningPaths'
import ActiveCourses from './components/ActiveCourses'
import Certifications from './components/Certifications'
import UpcomingAssessments from './components/UpcomingAssessments'
import Achievements from './components/Achievements'
import Leaderboard from './components/Leaderboard'
import TrainingAnalytics from './components/TrainingAnalytics'
import TrainingSkeleton from './components/TrainingSkeleton'
import { getTrainingDashboard } from './services/training.service'

export default function TrainingAcademy() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await Promise.resolve(getTrainingDashboard())
        setData(result)
      } catch {
        setError('Failed to load training data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <><DashboardSprites /><TrainingSkeleton /></>
  if (error || !data) {
    return (
      <>
        <DashboardSprites />
        <div className="tab-content active" role="tabpanel" aria-label="training-academy-error">
          <div className="tab-header-block">
            <h2 className="tab-heading">Training Academy</h2>
            <p className="tab-subheading" style={{ color: 'var(--color-red)' }}>{error || 'Could not load training data'}</p>
          </div>
        </div>
      </>
    )
  }

  const { kpis, continueLearning, activeCourses, learningPaths, certifications, assessments, achievements, leaderboard, analytics } = data

  return (
    <>
      <DashboardSprites />
      <div className="tab-content active" role="tabpanel" aria-label="training-academy">
        <div className="tab-header-block">
          <h2 className="tab-heading">Training Academy</h2>
          <p className="tab-subheading">Advance your skills with structured learning paths, certifications, and assessments.</p>
        </div>

        <TrainingHero kpis={kpis} continueLearning={continueLearning} />
        <TrainingKPIs kpis={kpis} />

        <ContinueLearning course={continueLearning} />

        <div className="tab-grid-layout" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 20 }}>
          <LearningPaths paths={learningPaths} />
          <ActiveCourses courses={activeCourses} />
        </div>

        <div className="tab-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Certifications certifications={certifications} />
          <UpcomingAssessments assessments={assessments} />
        </div>

        <div className="tab-grid-layout" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 20 }}>
          <Achievements achievements={achievements} />
          <Leaderboard entries={leaderboard} />
        </div>

        <TrainingAnalytics analytics={analytics} />
      </div>
    </>
  )
}
