import { ReviewRow } from '../../domain/review.repository';

/** "Ana López Pérez" → "Ana L." para no exponer el nombre completo del cliente. */
export const shortName = (name: string) => {
  const [first = 'Cliente', second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
};

export const ReviewPresenter = {
  item(r: ReviewRow, viewerId?: string | null) {
    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: shortName(r.user.name),
      isMine: !!viewerId && r.user.id === viewerId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  },
};
