export const AuthLifecycleStates = {
  BOOTSTRAPPING: 'BOOTSTRAPPING',
  READY: 'READY',
  AUTHENTICATED: 'AUTHENTICATED',
  REFRESHING: 'REFRESHING',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  LOGGING_OUT: 'LOGGING_OUT',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ERROR: 'ERROR',
} as const

export type AuthLifecycleState = (typeof AuthLifecycleStates)[keyof typeof AuthLifecycleStates]

export const AuthTransitionEvents = {
  BOOTSTRAP_COMPLETE: 'BOOTSTRAP_COMPLETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGOUT_COMPLETE: 'LOGOUT_COMPLETE',
  RESTORE: 'RESTORE',
  REFRESH: 'REFRESH',
  REFRESH_COMPLETE: 'REFRESH_COMPLETE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORCE_LOGOUT: 'FORCE_LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ERROR: 'ERROR',
} as const

export type AuthTransitionEvent = (typeof AuthTransitionEvents)[keyof typeof AuthTransitionEvents]

interface TransitionRule {
  to: AuthLifecycleState
  guard?: (from: AuthLifecycleState) => boolean
}

const TRANSITIONS: Record<AuthLifecycleState, Partial<Record<AuthTransitionEvent, TransitionRule>>> = {
  [AuthLifecycleStates.BOOTSTRAPPING]: {
    [AuthTransitionEvents.BOOTSTRAP_COMPLETE]: { to: AuthLifecycleStates.READY },
    [AuthTransitionEvents.RESTORE]: { to: AuthLifecycleStates.AUTHENTICATED },
  },
  [AuthLifecycleStates.READY]: {
    [AuthTransitionEvents.LOGIN]: { to: AuthLifecycleStates.AUTHENTICATED },
    [AuthTransitionEvents.RESTORE]: { to: AuthLifecycleStates.AUTHENTICATED },
  },
  [AuthLifecycleStates.AUTHENTICATED]: {
    [AuthTransitionEvents.LOGOUT]: { to: AuthLifecycleStates.LOGGING_OUT },
    [AuthTransitionEvents.REFRESH]: { to: AuthLifecycleStates.REFRESHING },
    [AuthTransitionEvents.SESSION_EXPIRED]: { to: AuthLifecycleStates.SESSION_EXPIRED },
    [AuthTransitionEvents.FORCE_LOGOUT]: { to: AuthLifecycleStates.LOGGING_OUT },
    [AuthTransitionEvents.PASSWORD_CHANGED]: { to: AuthLifecycleStates.LOGGING_OUT },
  },
  [AuthLifecycleStates.REFRESHING]: {
    [AuthTransitionEvents.REFRESH_COMPLETE]: { to: AuthLifecycleStates.AUTHENTICATED },
    [AuthTransitionEvents.SESSION_EXPIRED]: { to: AuthLifecycleStates.SESSION_EXPIRED },
    [AuthTransitionEvents.LOGOUT]: { to: AuthLifecycleStates.LOGGING_OUT },
    [AuthTransitionEvents.FORCE_LOGOUT]: { to: AuthLifecycleStates.LOGGING_OUT },
  },
  [AuthLifecycleStates.SESSION_EXPIRED]: {
    [AuthTransitionEvents.LOGIN]: { to: AuthLifecycleStates.AUTHENTICATED },
    [AuthTransitionEvents.RESTORE]: { to: AuthLifecycleStates.AUTHENTICATED },
    [AuthTransitionEvents.LOGOUT]: { to: AuthLifecycleStates.LOGGING_OUT },
  },
  [AuthLifecycleStates.LOGGING_OUT]: {
    [AuthTransitionEvents.LOGOUT_COMPLETE]: { to: AuthLifecycleStates.UNAUTHENTICATED },
  },
  [AuthLifecycleStates.UNAUTHENTICATED]: {
    [AuthTransitionEvents.LOGIN]: { to: AuthLifecycleStates.AUTHENTICATED },
    [AuthTransitionEvents.RESTORE]: { to: AuthLifecycleStates.AUTHENTICATED },
  },
  [AuthLifecycleStates.ERROR]: {
    [AuthTransitionEvents.RESTORE]: { to: AuthLifecycleStates.AUTHENTICATED },
    [AuthTransitionEvents.LOGIN]: { to: AuthLifecycleStates.AUTHENTICATED },
  },
}

type StateListener = (state: AuthLifecycleState, previous: AuthLifecycleState) => void

export class AuthStateMachine {
  private state: AuthLifecycleState = AuthLifecycleStates.BOOTSTRAPPING
  private listeners = new Set<StateListener>()

  getState(): AuthLifecycleState {
    return this.state
  }

  can(event: AuthTransitionEvent): boolean {
    return Boolean(TRANSITIONS[this.state][event])
  }

  transition(event: AuthTransitionEvent): AuthLifecycleState {
    const rule = TRANSITIONS[this.state][event]
    if (!rule) return this.state
    if (rule.guard && !rule.guard(this.state)) return this.state

    const previous = this.state
    this.state = rule.to
    this.listeners.forEach((listener) => listener(this.state, previous))
    return this.state
  }

  onTransition(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}
