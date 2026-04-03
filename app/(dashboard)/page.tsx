'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/shared/sidebar'
import { DashboardBotonesSection } from '@/features/dashboard/sections/dashboard-botones-section'
import { DashboardInicioSection } from '@/features/dashboard/sections/dashboard-inicio-section'
import { DashboardPerfilSection } from '@/features/dashboard/sections/dashboard-perfil-section'
import { DashboardPlantillaSection } from '@/features/dashboard/sections/dashboard-plantilla-section'
import { useDashboardController, type DashboardSection } from '@/features/dashboard/use-dashboard-controller'

export default function DashboardPage() {
  const {
    user,
    loading,
    activeSection,
    setActiveSection,
    profileForm,
    setProfileForm,
    links,
    profileStatus,
    linksStatus,
    templateStatus,
    isUploadingProfileImage,
    isUploadingBannerImage,
    profileImageInputRef,
    bannerImageInputRef,
    activeTemplate,
    handleProfileSave,
    handleImageUpload,
    handleTemplateSelect,
    updateLink,
    removeLink,
    addLink,
    saveLinks,
  } = useDashboardController()

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Sesion no disponible</h1>
          <p className="text-muted-foreground">Inicia sesion para administrar tu dashboard.</p>
          <Button asChild>
            <Link href="/login">Ir a login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen animate-in fade-in duration-700 ease-out">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as DashboardSection)}
      />
      <main className="flex-1 overflow-auto bg-background p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-700 ease-out delay-150 fill-mode-both">
        <div className="max-w-[1200px] mx-auto lg:px-8 xl:px-22">
          {activeSection === 'inicio' && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Home className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Panel</span>
              </div>
              <DashboardInicioSection />
            </div>
          )}

          {activeSection === 'perfil' && (
            <DashboardPerfilSection
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              profileStatus={profileStatus}
              isUploadingProfileImage={isUploadingProfileImage}
              isUploadingBannerImage={isUploadingBannerImage}
              profileImageInputRef={profileImageInputRef}
              bannerImageInputRef={bannerImageInputRef}
              onImageUpload={handleImageUpload}
              onSave={handleProfileSave}
            />
          )}

          {activeSection === 'botones' && (
            <DashboardBotonesSection
              links={links}
              linksStatus={linksStatus}
              onRemoveLink={removeLink}
              onUpdateLink={updateLink}
              onAddLink={addLink}
              onSaveLinks={saveLinks}
            />
          )}

          {activeSection === 'plantilla' && (
            <DashboardPlantillaSection
              user={user}
              activeTemplateName={activeTemplate.name}
              templateStatus={templateStatus}
              onTemplateSelect={handleTemplateSelect}
            />
          )}
        </div>
      </main>
    </div>
  )
}
