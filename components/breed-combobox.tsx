import { useState, useEffect, useMemo } from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';
import { useI18n } from '../context/I18nContext';

interface BreedComboboxProps {
  breeds: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function matchSearch(text: string, search: string): boolean {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  return text.toLowerCase().includes(s);
}

/**
 * Combobox для выбора породы: дропдаун с поиском и возможностью ввести своё значение.
 * Варианты: пустой, список пород, «Другое», плюс любое введённое пользователем значение.
 */
export function BreedCombobox({
  breeds,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: BreedComboboxProps) {
  const { t } = useI18n();
  const OPTION_OTHER = t.pet.animalType.other;
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const breedList = useMemo(() => [...breeds], [breeds]);

  const filteredBreeds = useMemo(() => {
    return breedList.filter((b) => matchSearch(b, inputValue));
  }, [breedList, inputValue]);

  const trimmedInput = inputValue.trim();
  const showCreatable =
    trimmedInput &&
    !breedList.includes(trimmedInput) &&
    trimmedInput !== OPTION_OTHER;

  const handleSelect = (selected: string) => {
    onChange(selected);
    setInputValue(selected);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && showCreatable) {
      onChange(trimmedInput);
    }
    setOpen(nextOpen);
  };

  const resolvedPlaceholder = placeholder || t.petForm.selectOrEnterBreed;
  const displayValue = value || resolvedPlaceholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400',
            className
          )}
        >
          <span className={cn('truncate', !value && 'text-gray-400 dark:text-gray-500')}>
            {displayValue}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t.petForm.searchOrEnter}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandGroup>
              <CommandItem
                value="__empty__"
                onSelect={() => handleSelect('')}
                className={matchSearch(t.pet.notSpecified, inputValue) ? undefined : 'hidden'}
              >
                <CheckIcon className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                {t.pet.notSpecified}
              </CommandItem>
              {filteredBreeds.map((breed) => (
                <CommandItem key={breed} value={breed} onSelect={() => handleSelect(breed)}>
                  <CheckIcon className={cn('mr-2 h-4 w-4', value === breed ? 'opacity-100' : 'opacity-0')} />
                  {breed}
                </CommandItem>
              ))}
              {showCreatable && (
                <CommandItem
                  value={`__creatable__${trimmedInput}`}
                  onSelect={() => {
                    onChange(trimmedInput);
                    setInputValue(trimmedInput);
                    setOpen(false);
                  }}
                >
                  {t.petForm.use} «{trimmedInput}»
                </CommandItem>
              )}
              <CommandItem
                value={OPTION_OTHER}
                onSelect={() => handleSelect(OPTION_OTHER)}
                className={matchSearch(OPTION_OTHER, inputValue) ? undefined : 'hidden'}
              >
                <CheckIcon className={cn('mr-2 h-4 w-4', value === OPTION_OTHER ? 'opacity-100' : 'opacity-0')} />
                {OPTION_OTHER}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
