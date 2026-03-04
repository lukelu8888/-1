import { FormTemplate } from '../formTemplates';
import hdTemplatesPart1 from './part1-trade';
import hdTemplatesPart2 from './part2-contracts';
import hdTemplatesPart3 from './part3-logistics';
import hdTemplatesPart4 from './part4-finance';

const homeDepotRealTemplates: FormTemplate[] = [
  ...hdTemplatesPart1,
  ...hdTemplatesPart2,
  ...hdTemplatesPart3,
  ...hdTemplatesPart4,
];

export default homeDepotRealTemplates;
