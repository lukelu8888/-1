import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { cn } from '../ui/utils';
import { Check, ChevronsUpDown } from 'lucide-react@0.487.0';
import { searchPorts } from '../../data/freightRatesData';
import {
  CUSTOMER_BUSINESS_SCENARIO_OPTIONS,
  CUSTOMER_CERTIFICATION_OPTIONS,
  CUSTOMER_DOCUMENT_RELEASE_OPTIONS,
  CUSTOMER_PACKING_PRESET_OPTIONS,
  CUSTOMER_PAYMENT_METHOD_OPTIONS,
  CUSTOMER_TRADE_TERM_OPTIONS,
  getTradeTermLocationConfig,
  shouldDisplayFinalDestination,
  syncCustomerInquiryRequirementFields,
  type CustomerInquiryRequirementFormFields,
} from '../documents/templates/CustomerInquiryDocument';

type CustomerTradingRequirementsFormProps = {
  value: CustomerInquiryRequirementFormFields;
  onChange: (value: CustomerInquiryRequirementFormFields) => void;
  className?: string;
  compact?: boolean;
};

const PAYMENT_METHOD_WITH_CREDIT_DAYS = new Set(['da', 'oa']);
const DRAWING_UPLOAD_SCENARIOS = new Set([
  'mold_development',
  'custom_product',
  'sample_to_production',
]);
const PORT_BASED_INCOTERMS = new Set(['FOB', 'CFR', 'CIF']);
const ADD_CUSTOM_TEXT_VALUE = '__add_custom_text__';

const splitStructuredField = (rawValue: string, presets: readonly string[]) => {
  const presetMap = new Map(presets.map((item) => [item.toLowerCase(), item]));
  const tokens = String(rawValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const selected: string[] = [];
  const notes: string[] = [];

  tokens.forEach((token) => {
    const canonical = presetMap.get(token.toLowerCase());
    if (canonical) {
      if (!selected.includes(canonical)) selected.push(canonical);
      return;
    }
    notes.push(token);
  });

  return {
    selected,
    custom: notes,
    notes: notes.join(', '),
  };
};

const mergeStructuredField = (selected: string[], notes: string) =>
  [...selected, String(notes || '').trim()].filter(Boolean).join(', ');

const removeToken = (items: string[], target: string) =>
  items.filter((item) => item !== target);

const FIELD_SURFACE_CLASS =
  'w-full rounded-md border-0 bg-slate-100 px-4 py-2 text-[14px] text-slate-900 shadow-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-300';

const formatPortLabel = (name: string, country: string) => `${name}, ${country}`;

function SearchablePortField({
  id,
  value,
  onChange,
  placeholder,
  allowCustomText = false,
  open,
  onOpenChange,
  emptyMessage = 'No matching port.',
  customPlaceholder = 'Enter custom port',
  toggleAriaLabel = 'Toggle port list',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowCustomText?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emptyMessage?: string;
  customPlaceholder?: string;
  toggleAriaLabel?: string;
}) {
  const [query, setQuery] = useState(value || '');
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const filteredPorts = searchPorts(query.trim()).sort((a, b) => {
    const labelA = formatPortLabel(a.name, a.country);
    const labelB = formatPortLabel(b.name, b.country);
    return labelA.localeCompare(labelB);
  });

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        onOpenChange(false);
        setCustomMode(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery(value || '');
      setCustomMode(false);
      setCustomText('');
    }
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePanelPosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextPortalHost =
        (containerRef.current.closest('[data-radix-dialog-content]') as HTMLElement | null) ||
        (containerRef.current.closest('[role="dialog"]') as HTMLElement | null) ||
        document.body;
      const hostRect =
        nextPortalHost === document.body
          ? { top: 0, left: 0 }
          : nextPortalHost.getBoundingClientRect();

      setPortalHost(nextPortalHost);
      setPanelStyle({
        top: rect.bottom - hostRect.top + 8,
        left: rect.left - hostRect.left,
        width: rect.width,
      });
    };

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative z-0', open && 'z-[1400]')}>
      <div className="relative">
        <Input
          id={id}
          value={open ? query : value}
          onFocus={() => {
            onOpenChange(true);
            setQuery('');
            setCustomMode(false);
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            onOpenChange(true);
            setCustomMode(false);
          }}
          placeholder={placeholder}
          className={cn('h-9 pr-12', FIELD_SURFACE_CLASS)}
        />
        <button
          type="button"
          onClick={() => {
            const nextOpen = !open;
            onOpenChange(nextOpen);
            if (nextOpen) {
              setQuery('');
              setCustomMode(false);
            }
          }}
          className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"
          aria-label={toggleAriaLabel}
        >
          <ChevronsUpDown className="h-5 w-5 shrink-0" />
        </button>
      </div>

      {open && panelStyle ? createPortal(
        <div
          ref={dropdownRef}
          className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl"
          style={{
            position: portalHost === document.body ? 'fixed' : 'absolute',
            top: panelStyle.top,
            left: panelStyle.left,
            width: panelStyle.width,
            zIndex: 9999,
          }}
        >
          <div
            className="port-dropdown-scrollbar max-h-72 overflow-y-auto overscroll-contain py-1"
            style={{ scrollbarGutter: 'stable' }}
          >
            {filteredPorts.length > 0 ? (
              <>
                {filteredPorts.map((port) => {
                  const portLabel = formatPortLabel(port.name, port.country);

                  return (
                    <button
                      key={port.code}
                      type="button"
                      onClick={() => {
                        onChange(portLabel);
                        onOpenChange(false);
                        setQuery(portLabel);
                        setCustomMode(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-1 text-left text-base hover:bg-slate-50"
                    >
                      <Check className={cn('h-4 w-4 shrink-0', value === portLabel ? 'opacity-100' : 'opacity-0')} />
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] leading-[1.05] text-slate-900">{portLabel}</span>
                        <span className="text-[11px] leading-[1.05] text-slate-500">{port.code}</span>
                      </div>
                    </button>
                  );
                })}
                {allowCustomText ? (
                  <button
                    type="button"
                    onClick={() => setCustomMode(true)}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                  >
                    <Check className={cn('h-4 w-4 shrink-0', customMode ? 'opacity-100' : 'opacity-0')} />
                    <span>Custom...</span>
                  </button>
                ) : null}
              </>
            ) : (
              <div className="px-3 py-4 text-sm text-slate-500">{emptyMessage}</div>
            )}
            {allowCustomText && customMode ? (
              <div className="border-t border-slate-100 p-3">
                <div className="flex gap-2">
                  <Input
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder={customPlaceholder}
                    className={cn('h-9', FIELD_SURFACE_CLASS)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextValue = customText.trim();
                      if (!nextValue) return;
                      onChange(nextValue);
                      onOpenChange(false);
                      setQuery(nextValue);
                      setCustomText('');
                      setCustomMode(false);
                    }}
                    disabled={!customText.trim()}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>,
        portalHost || document.body,
      ) : null}
    </div>
  );
}

function TokenSelectField({
  label,
  selectId,
  value,
  onChange,
  options,
  placeholder,
  isCustomMode,
  onCustomModeChange,
  compact = false,
}: {
  label: string;
  selectId: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  isCustomMode: boolean;
  onCustomModeChange: (isCustomMode: boolean) => void;
  compact?: boolean;
}) {
  const [customInput, setCustomInput] = useState('');
  const { selected, custom } = splitStructuredField(value, options);
  const items = [...selected, ...custom];

  const handleAddCustomText = () => {
    const nextValue = customInput.trim();
    if (!nextValue || items.includes(nextValue)) return;
    onChange([...items, nextValue].join(', '));
    setCustomInput('');
    onCustomModeChange(false);
  };

  const handleRemove = (token: string) => {
    onChange(removeToken(items, token).join(', '));
  };

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <Label htmlFor={selectId}>{label}</Label>
      <div className="space-y-2">
        <select
          id={selectId}
          value={isCustomMode ? ADD_CUSTOM_TEXT_VALUE : ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === ADD_CUSTOM_TEXT_VALUE) {
              setCustomInput('');
              onCustomModeChange(true);
              return;
            }
            onCustomModeChange(false);
            if (!nextValue) {
              return;
            }
            if (items.includes(nextValue)) {
              return;
            }
            onChange([...items, nextValue].join(', '));
          }}
          className={cn('flex h-9', FIELD_SURFACE_CLASS)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value={ADD_CUSTOM_TEXT_VALUE}>Custom...</option>
        </select>

        {isCustomMode ? (
          <div className="space-y-1">
            <Input
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddCustomText();
                }
              }}
              placeholder="Enter custom text"
              className={cn('h-9', FIELD_SURFACE_CLASS)}
              autoFocus
            />
            {!compact ? <p className="px-1 text-xs text-slate-500">Type and press Enter.</p> : null}
          </div>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => handleRemove(token)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              {token} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CustomerTradingRequirementsForm({
  value,
  onChange,
  className = '',
  compact = false,
}: CustomerTradingRequirementsFormProps) {
  const [openPortField, setOpenPortField] = useState<'location' | 'finalDestination' | null>(null);
  const [activeCustomField, setActiveCustomField] = useState<'packing' | 'certificate' | null>(null);
  const incoterm = value.incoterm || 'FOB';
  const locationConfig = getTradeTermLocationConfig(incoterm);
  const paymentMode = value.paymentMode || 'tt_deposit_balance_before_shipment';
  const showInsuranceRequirement = incoterm === 'CIF';
  const showCreditDays = PAYMENT_METHOD_WITH_CREDIT_DAYS.has(paymentMode);
  const showBusinessScenario = paymentMode === 'tt_100_before_production';
  const showDrawingUploadHint = DRAWING_UPLOAD_SCENARIOS.has(value.businessScenario || '');
  const usesPortSelectorForLocation = PORT_BASED_INCOTERMS.has(incoterm);
  const shouldEmphasizeDifferentFinalDestination = ['CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DDP'].includes(incoterm);
  const showFinalDestinationAsDistinct = shouldDisplayFinalDestination(value);

  const updateField = (patch: Partial<CustomerInquiryRequirementFormFields>) => {
    onChange(syncCustomerInquiryRequirementFields({ ...value, ...patch }));
  };

  const selectedTradeTermOption =
    CUSTOMER_TRADE_TERM_OPTIONS.find((option) => option.value === incoterm) ?? CUSTOMER_TRADE_TERM_OPTIONS[0];

  let stepNumber = 0;
  const nextStepLabel = (label: string) => {
    stepNumber += 1;
    return `${stepNumber}. ${label}`;
  };

  return (
    <div className={cn(compact ? 'space-y-3' : 'space-y-5', className)}>
      <div className="space-y-2">
        <Label htmlFor="customer-incoterm">{nextStepLabel('Trade Term')}</Label>
        <Select value={incoterm} onValueChange={(nextValue) => updateField({ incoterm: nextValue })}>
          <SelectTrigger
            id="customer-incoterm"
            className={cn(
              'h-9 rounded-md border-0 bg-slate-100 px-4 text-[14px] text-slate-900 shadow-none focus:ring-2 focus:ring-slate-300',
            )}
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="shrink-0 font-medium text-[14px] text-slate-900">{selectedTradeTermOption.code}</span>
              <span className="truncate text-[12px] text-slate-600">{selectedTradeTermOption.description}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
          {CUSTOMER_TRADE_TERM_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-baseline gap-2">
                <span className="font-medium text-[14px] text-slate-900">{option.code}</span>
                <span className="text-[12px] text-slate-600">{option.description}</span>
              </span>
            </SelectItem>
          ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-location-value">{nextStepLabel(locationConfig.label)}</Label>
        {usesPortSelectorForLocation ? (
          <SearchablePortField
            id="customer-location-value"
            value={value.locationValue || ''}
            onChange={(nextValue) => updateField({ locationValue: nextValue })}
            placeholder={locationConfig.placeholder}
            open={openPortField === 'location'}
            onOpenChange={(open) => setOpenPortField(open ? 'location' : null)}
            emptyMessage="No matching loading port."
            toggleAriaLabel="Toggle loading port list"
          />
        ) : (
          <Input
            id="customer-location-value"
            value={value.locationValue || ''}
            onChange={(event) => updateField({ locationValue: event.target.value })}
            placeholder={locationConfig.placeholder}
            className="h-9 rounded-md border-0 bg-slate-100 px-4 text-[14px] shadow-none"
          />
        )}
      </div>

      <div className={cn('space-y-2', openPortField === 'location' && 'invisible pointer-events-none')}>
        <Label htmlFor="customer-final-destination">
          {nextStepLabel(shouldEmphasizeDifferentFinalDestination ? 'Final Destination (if different)' : 'Final Destination')}
        </Label>
        <SearchablePortField
          id="customer-final-destination"
          value={value.finalDestinationPlan || ''}
          onChange={(nextValue) => updateField({ finalDestinationPlan: nextValue })}
          placeholder={
            shouldEmphasizeDifferentFinalDestination
              ? 'Only fill this if the final destination differs from the location above'
              : 'Search final destination or add custom text'
          }
          allowCustomText
          open={openPortField === 'finalDestination'}
          onOpenChange={(open) => setOpenPortField(open ? 'finalDestination' : null)}
          emptyMessage="No matching destination port."
          customPlaceholder="Enter final destination"
          toggleAriaLabel="Toggle destination port list"
        />
        {shouldEmphasizeDifferentFinalDestination ? (
          <p className="text-xs text-slate-500">
            {showFinalDestinationAsDistinct
              ? 'This final destination will be shown separately because it differs from the transport location above.'
              : 'Leave this blank if the final destination is the same as the transport location above.'}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-delivery-time">{nextStepLabel('Delivery Time')}</Label>
        <Input
          id="customer-delivery-time"
          value={value.deliveryTime || ''}
          onChange={(event) => updateField({ deliveryTime: event.target.value })}
          placeholder="Example: Within 30 days after order confirmation"
          className="h-9 rounded-md border-0 bg-slate-100 px-4 text-[14px] shadow-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-payment-method">{nextStepLabel('Payment Method')}</Label>
        <select
          id="customer-payment-method"
          value={paymentMode}
          onChange={(event) => updateField({ paymentMode: event.target.value })}
          className={cn('flex h-9', FIELD_SURFACE_CLASS)}
        >
          {CUSTOMER_PAYMENT_METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {showCreditDays ? (
        <div className="space-y-2">
          <Label htmlFor="customer-credit-days">{nextStepLabel('Credit Period (Days)')}</Label>
          <Input
            id="customer-credit-days"
            value={value.creditDays || ''}
            onChange={(event) => updateField({ creditDays: event.target.value.replace(/[^\d]/g, '') })}
            placeholder="Example: 30"
            className="h-9 rounded-md border-0 bg-slate-100 px-4 text-[14px] shadow-none"
          />
        </div>
      ) : null}

      {showBusinessScenario ? (
        <div className="space-y-2">
          <Label htmlFor="customer-business-scenario">{nextStepLabel('Business Scenario')}</Label>
          <select
            id="customer-business-scenario"
            value={value.businessScenario || ''}
            onChange={(event) => updateField({ businessScenario: event.target.value, businessScenarioNotes: '' })}
            className={cn('flex h-9', FIELD_SURFACE_CLASS)}
          >
            <option value="">Select a scenario</option>
            {CUSTOMER_BUSINESS_SCENARIO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {showDrawingUploadHint && !compact ? (
            <p className="text-xs text-slate-500">
              If this product requires drawings or technical files, upload them in My Products before submitting the inquiry.
              The files will flow to the salesperson side together with the inquiry.
            </p>
          ) : null}
        </div>
      ) : null}

      {showInsuranceRequirement ? (
        <div className="space-y-2">
          <Label htmlFor="customer-insurance">{nextStepLabel('Insurance Requirement')}</Label>
          <Input
            id="customer-insurance"
            value={value.insuranceRequirement || ''}
            onChange={(event) => updateField({ insuranceRequirement: event.target.value })}
            placeholder="Example: 110% invoice value, ICC(A)"
            className="h-9 rounded-md border-0 bg-slate-100 px-4 text-[14px] shadow-none"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="customer-document-release">{nextStepLabel('Documents')}</Label>
        <select
          id="customer-document-release"
          value={value.documentReleasePreference || ''}
          onChange={(event) => updateField({ documentReleasePreference: event.target.value })}
          className={cn('flex h-9', FIELD_SURFACE_CLASS)}
        >
          {CUSTOMER_DOCUMENT_RELEASE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

        <TokenSelectField
          label={nextStepLabel('Packing request')}
          selectId="customer-packing-select"
          value={value.packingRequirements || ''}
          onChange={(nextValue) => updateField({ packingRequirements: nextValue })}
          options={CUSTOMER_PACKING_PRESET_OPTIONS}
          placeholder="Select a packing request"
          isCustomMode={activeCustomField === 'packing'}
          onCustomModeChange={(isCustomMode) => setActiveCustomField(isCustomMode ? 'packing' : null)}
          compact={compact}
        />

        <TokenSelectField
          label={nextStepLabel('Certificate request')}
          selectId="customer-certification-select"
          value={value.certifications || ''}
          onChange={(nextValue) => updateField({ certifications: nextValue })}
          options={CUSTOMER_CERTIFICATION_OPTIONS}
          placeholder="Select a certificate"
          isCustomMode={activeCustomField === 'certificate'}
          onCustomModeChange={(isCustomMode) => setActiveCustomField(isCustomMode ? 'certificate' : null)}
          compact={compact}
        />

      <div className="space-y-2">
        <Label htmlFor="customer-other-requirements">{nextStepLabel('Extra request')}</Label>
        <Textarea
          id="customer-other-requirements"
          value={value.otherRequirements || ''}
          onChange={(event) => updateField({ otherRequirements: event.target.value })}
          placeholder="Any additional commercial, technical, or project notes"
          rows={4}
          className="rounded-md border-0 bg-slate-100 px-4 py-2.5 text-[14px] shadow-none"
        />
      </div>
    </div>
  );
}
