export interface DocumentConditionItem {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export interface DocumentConditionGroup {
  key: string;
  title: string;
  titleEn?: string;
  items: DocumentConditionItem[];
}
