import React, { useMemo, useCallback } from 'react'
import styled from '../../lib/styled'
import {
  borderRight,
  secondaryButtonStyle,
  flexCenter,
} from '../../lib/styled/styleFunctions'
import { useDb } from '../../lib/db'
import { entries } from '../../lib/db/utils'
import Icon from '../atoms/Icon'
import { mdiPlus, mdiCircleMedium } from '@mdi/js'
import { useRouter } from '../../lib/router'
import { useActiveStorageId, useRouteParams } from '../../lib/routeParams'
import AppNavigatorStorageItem from '../molecules/AppNavigatorStorageItem'
import { usePreferences } from '../../lib/preferences'
import { openContextMenu } from '../../lib/electronOnly'
import { osName } from '../../lib/platform'
import { useGeneralStatus } from '../../lib/generalStatus'
import AppNavigatorBoostHubTeamItem from '../molecules/AppNavigatorBoostHubTeamItem'
import { useBoostHub } from '../../lib/boosthub'
import {
  useCheckedFeatures,
  featureBoostHubSignIn,
} from '../../lib/checkedFeatures'
import { MenuItemConstructorOptions } from 'electron/main'
import { useCreateWorkspaceModal } from '../../lib/createWorkspaceModal'

const TopLevelNavigator = () => {
  const { storageMap } = useDb()
  const { push } = useRouter()
  const { setPreferences, preferences } = usePreferences()
  const { generalStatus } = useGeneralStatus()
  const routeParams = useRouteParams()
  const { isChecked } = useCheckedFeatures()

  const boostHubUserInfo = preferences['boosthub.user']

  const activeStorageId = useActiveStorageId()

  const storages = useMemo(() => {
    return entries(storageMap).map(([storageId, storage]) => {
      const active = activeStorageId === storageId
      return (
        <AppNavigatorStorageItem
          key={storageId}
          active={active}
          storage={storage}
        />
      )
    })
  }, [storageMap, activeStorageId])

  const activeBoostHubTeamDomain = useMemo<string | null>(() => {
    if (routeParams.name !== 'boosthub.teams.show') {
      return null
    }
    return routeParams.domain
  }, [routeParams])

  const boostHubTeams = useMemo(() => {
    return generalStatus.boostHubTeams.map((boostHubTeam) => {
      return (
        <AppNavigatorBoostHubTeamItem
          key={`boost-hub-team-${boostHubTeam.domain}`}
          active={activeBoostHubTeamDomain === boostHubTeam.domain}
          name={boostHubTeam.name}
          domain={boostHubTeam.domain}
          iconUrl={boostHubTeam.iconUrl}
        />
      )
    })
  }, [generalStatus.boostHubTeams, activeBoostHubTeamDomain])

  const { setGeneralStatus } = useGeneralStatus()
  const { requestSignOut } = useBoostHub()

  const signOut = useCallback(async () => {
    if (
      routeParams.name === 'boosthub.teams.show' ||
      routeParams.name === 'boosthub.teams.create'
    ) {
      push('/app/boosthub/login')
    }
    setPreferences({
      'boosthub.user': null,
    })
    setGeneralStatus({
      boostHubTeams: [],
    })
    try {
      await requestSignOut()
    } catch (error) {
      console.warn('Failed to send signing out request', error)
    }
  }, [routeParams.name, setPreferences, setGeneralStatus, requestSignOut, push])

  const openSideNavContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      openContextMenu({
        menuItems: [
          {
            type: 'normal',
            label: 'Create a Local Workspace',
            click: async () => {
              push(`/app/storages`)
            },
          },
          ...(boostHubUserInfo != null
            ? ([
                {
                  type: 'normal',
                  label: 'Create a Team Workspace',
                  click: async () => {
                    push('/app/boosthub/teams')
                  },
                },
              ] as MenuItemConstructorOptions[])
            : ([] as MenuItemConstructorOptions[])),
          {
            type: 'separator',
          },
          boostHubUserInfo == null
            ? {
                type: 'normal',
                label: 'Create a Team Account',
                click: () => {
                  push('/app/boosthub/login')
                },
              }
            : {
                type: 'normal',
                label: 'Sign Out Team Account',
                click: signOut,
              },
          {
            type: 'separator',
          },
          {
            type: 'normal',
            label: 'Hide App Navigator',
            click: () => {
              setPreferences({
                'general.showAppNavigator': false,
              })
            },
          },
        ],
      })
    },
    [boostHubUserInfo, push, setPreferences, signOut]
  )

  const { toggleShowCreateWorkspaceModal } = useCreateWorkspaceModal()

  return (
    <Container>
      {osName === 'macos' && <Spacer />}
      <ListContainer onContextMenu={openSideNavContextMenu}>
        {storages}
        {boostHubTeams}
      </ListContainer>
      <ControlContainer>
        <NavigatorButton
          title='Create Workspace'
          onClick={toggleShowCreateWorkspaceModal}
        >
          <Icon path={mdiPlus} />
          {!isChecked(featureBoostHubSignIn) && (
            <Icon className='redDot' path={mdiCircleMedium} />
          )}
        </NavigatorButton>
      </ControlContainer>
    </Container>
  )
}

export default TopLevelNavigator

const Spacer = styled.div`
  height: 12px;
  flex-shrink: 0;
`

const Container = styled.div`
  width: 68px;
  height: 100%;
  ${borderRight}
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  overflow-y: auto;
`

const ListContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-items: center;
  align-items: center;
  margin-top: 8px;
`

const ControlContainer = styled.div`
  display: flex;
  justify-content: center;
`

const NavigatorButton = styled.button`
  ${secondaryButtonStyle}
  position: relative;
  height: 36px;
  width: 36px;
  margin-bottom: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 22px;
  border-radius: 8px;
  border: none;

  &:first-child {
    margin-top: 5px;
  }
  .redDot {
    position: absolute;
    color: ${({ theme }) => theme.dangerColor};
    top: -3px;
    right: -3px;
    ${flexCenter}
  }
`
