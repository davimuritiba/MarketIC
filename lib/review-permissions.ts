export const REVIEW_EDIT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

type ComputePermissionsOptions = {
  viewerId?: string | null;
  authorId: string;
  createdAt: Date;
  referenceDate?: Date;
};

export function computeReviewPermissions({
  viewerId,
  authorId,
  createdAt,
  referenceDate,
}: ComputePermissionsOptions) {
  const viewer = viewerId ?? null;
  const now = referenceDate?.getTime() ?? Date.now();
  const isAuthor = Boolean(viewer) && viewer === authorId;
  const canDelete = isAuthor;
  const canEdit =
    isAuthor && now - createdAt.getTime() <= REVIEW_EDIT_WINDOW_MS;

  return { canEdit, canDelete };
}
