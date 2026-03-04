import { AdvancedFormTemplate } from '../formLayoutSystem';
import advancedTemplatesPart1 from './part1-trade';
import advancedTemplatesPart2 from './part2-quotation';
import advancedTemplatesPart3 from './part3-logistics';

const advancedFormTemplates: AdvancedFormTemplate[] = [
  ...advancedTemplatesPart1,
  ...advancedTemplatesPart2,
  ...advancedTemplatesPart3,
];

export default advancedFormTemplates;
