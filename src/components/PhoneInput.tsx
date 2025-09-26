import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const countryCodes = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+32', country: 'BE', flag: '🇧🇪' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+43', country: 'AT', flag: '🇦🇹' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+358', country: 'FI', flag: '🇫🇮' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+56', country: 'CL', flag: '🇨🇱' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
  { code: '+51', country: 'PE', flag: '🇵🇪' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+20', country: 'EG', flag: '🇪🇬' },
  { code: '+234', country: 'NG', flag: '🇳🇬' },
  { code: '+254', country: 'KE', flag: '🇰🇪' },
  { code: '+233', country: 'GH', flag: '🇬🇭' },
  { code: '+256', country: 'UG', flag: '🇺🇬' },
  { code: '+255', country: 'TZ', flag: '🇹🇿' },
  { code: '+250', country: 'RW', flag: '🇷🇼' },
];

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  required?: boolean;
}

export const PhoneInput = ({ 
  countryCode, 
  phoneNumber, 
  onCountryCodeChange, 
  onPhoneNumberChange, 
  required 
}: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const [countryCodeInput, setCountryCodeInput] = useState('');

  const selectedCountryCode = countryCodes.find(cc => cc.code === countryCode);

  const handleCountryCodeInputChange = (value: string) => {
    setCountryCodeInput(value);
    
    // Allow typing numbers directly
    if (value.match(/^\d+$/)) {
      const fullCode = '+' + value;
      const matchingCode = countryCodes.find(cc => cc.code === fullCode);
      if (matchingCode) {
        onCountryCodeChange(fullCode);
      }
    }
  };

  const filteredCountryCodes = countryCodes.filter(cc => 
    cc.code.includes(countryCodeInput) || 
    cc.country.toLowerCase().includes(countryCodeInput.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-32 justify-between bg-input border-border text-foreground"
            >
              {selectedCountryCode ? (
                <span className="flex items-center gap-1">
                  {selectedCountryCode.flag} {selectedCountryCode.code}
                </span>
              ) : (
                "+1"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-popover border-border">
            <Command>
              <CommandInput 
                placeholder="Search or type code..." 
                className="text-foreground"
                value={countryCodeInput}
                onValueChange={handleCountryCodeInputChange}
              />
              <CommandList>
                <CommandEmpty>No country code found.</CommandEmpty>
                <CommandGroup>
                  {filteredCountryCodes.map((cc) => (
                    <CommandItem
                      key={cc.code}
                      value={`${cc.code} ${cc.country}`}
                      onSelect={() => {
                        onCountryCodeChange(cc.code);
                        setOpen(false);
                        setCountryCodeInput('');
                      }}
                      className="cursor-pointer hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          countryCode === cc.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex items-center gap-2">
                        {cc.flag} {cc.code} ({cc.country})
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          id="phone"
          type="tel"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
          required={required}
        />
      </div>
    </div>
  );
};