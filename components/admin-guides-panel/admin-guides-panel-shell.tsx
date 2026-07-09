import { adm } from '../admin-panel-chrome';
import { AdminGuidesCategoriesTable } from './admin-guides-categories-table';
import { AdminGuidesCategoryModal } from './admin-guides-category-modal';
import { AdminGuidesVideoModal } from './admin-guides-video-modal';
import { AdminGuidesVideosTable } from './admin-guides-videos-table';
import { AdminGuidesViewTabs } from './admin-guides-view-tabs';
import { useAdminGuidesPanel } from './use-admin-guides-panel';

export function AdminGuidesPanel() {
  const p = useAdminGuidesPanel();

  if (p.loading) {
    return <p className={adm.lead}>{p.g.loading}</p>;
  }

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{p.g.title}</h2>
          <p className={adm.lead}>{p.g.hint}</p>
        </div>
      </div>

      <AdminGuidesViewTabs
        view={p.view}
        tabVideosLabel={p.g.tabVideos}
        tabCategoriesLabel={p.g.tabCategories}
        onViewChange={p.setView}
      />

      {p.view === 'categories' ? (
        <AdminGuidesCategoriesTable
          g={p.g}
          categories={p.categoriesSorted}
          onCreate={p.openCreateCategory}
          onEdit={p.openEditCategory}
          onDelete={(id) => void p.deleteCategory(id)}
        />
      ) : (
        <AdminGuidesVideosTable
          g={p.g}
          videos={p.videosSorted}
          hasCategories={p.categories.length > 0}
          onCreate={p.openCreateVideo}
          onGoToCategories={() => p.setView('categories')}
          onEdit={p.openEditVideo}
          onDelete={(id) => void p.deleteVideo(id)}
        />
      )}

      {p.categoryEdit ? (
        <AdminGuidesCategoryModal
          edit={p.categoryEdit}
          g={p.g}
          catTitle={p.catTitle}
          setCatTitle={p.setCatTitle}
          catSlug={p.catSlug}
          setCatSlug={p.setCatSlug}
          catSort={p.catSort}
          setCatSort={p.setCatSort}
          catSaving={p.catSaving}
          onClose={() => p.setCategoryEdit(null)}
          onSave={() => void p.saveCategory()}
        />
      ) : null}

      {p.videoEdit ? (
        <AdminGuidesVideoModal
          edit={p.videoEdit}
          g={p.g}
          categories={p.categoriesSorted}
          vidTitle={p.vidTitle}
          setVidTitle={p.setVidTitle}
          vidDesc={p.vidDesc}
          setVidDesc={p.setVidDesc}
          vidUrl={p.vidUrl}
          setVidUrl={p.setVidUrl}
          vidCategory={p.vidCategory}
          setVidCategory={p.setVidCategory}
          vidSort={p.vidSort}
          setVidSort={p.setVidSort}
          vidStatus={p.vidStatus}
          setVidStatus={p.setVidStatus}
          vidSaving={p.vidSaving}
          onClose={() => p.setVideoEdit(null)}
          onSave={() => void p.saveVideo()}
        />
      ) : null}
    </div>
  );
}
