import { cn } from '../../../ui/utils';
import {
  CAMPAIGN_STATUS_LOOK,
  PRODUCT_STATUS_LOOK,
  PUBLISH_STATUS_LOOK,
  REVIEW_STATUS_LOOK,
} from '../context/statusConfig';
import type {
  CampaignStatus,
  ProductStatus,
  PublishStatus,
  ReviewStatus,
} from '../context/types';

type Kind = 'product' | 'review' | 'publish' | 'campaign';

interface Props {
  kind: Kind;
  status: ProductStatus | ReviewStatus | PublishStatus | CampaignStatus;
  /** show English label below Chinese */
  bilingual?: boolean;
  size?: 'sm' | 'xs';
  className?: string;
}

export function StatusBadge({
  kind,
  status,
  bilingual,
  size = 'sm',
  className,
}: Props) {
  const look = (() => {
    switch (kind) {
      case 'product':
        return PRODUCT_STATUS_LOOK[status as ProductStatus];
      case 'review':
        return REVIEW_STATUS_LOOK[status as ReviewStatus];
      case 'publish':
        return PUBLISH_STATUS_LOOK[status as PublishStatus];
      case 'campaign':
        return CAMPAIGN_STATUS_LOOK[status as CampaignStatus];
    }
  })();

  if (!look) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 leading-none whitespace-nowrap',
        size === 'sm' ? 'h-5 text-[11px]' : 'h-4 text-[10px]',
        look.className,
        className,
      )}
    >
      <span>{look.label}</span>
      {bilingual && <span className="opacity-60">· {look.labelEn}</span>}
    </span>
  );
}
