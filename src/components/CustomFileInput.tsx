import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // We'll use this for displaying the file name
import { Label } from '@/components/ui/label'; // For better accessibility

interface FileInputProps {
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomFileInput: React.FC<FileInputProps> = ({
  onChange,
  accept,
  disabled,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onChange(file || null);
    setSelectedFileName(file?.name || null);
  };

  return (
    <div className={className}>
      <Label htmlFor="fileInput" className="sr-only">
        Upload CSV File
      </Label>
      <Input
        id="fileInput"
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden" // Hide the default input
        disabled={disabled}
        ref={fileInputRef}
      />
      <div className="flex items-center space-x-2">
        <Button onClick={handleButtonClick} disabled={disabled} className='cursor-pointer bg-black/50 text-white border border-gray-700 placeholder:text-gray-400'>
          {selectedFileName ? 'Change File' : 'Click to choose file'}
        </Button>
        {selectedFileName && (
          <span className="text-sm text-muted-foreground">{selectedFileName}</span>
        )}
      </div>
    </div>
  );
};