import React from 'react';

interface SafeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (val: string) => void;
}

export const SafeInput = ({ value, onValueChange, ...props }: SafeInputProps) => {
  const [innerValue, setInnerValue] = React.useState(value);
  const isComposing = React.useRef(false);

  React.useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInnerValue(val);
    if (!isComposing.current) {
      onValueChange(val);
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposing.current = false;
    // @ts-ignore
    onValueChange(e.target.value);
  };

  return (
    <input
      {...props}
      value={innerValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  );
};

interface SafeTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (val: string) => void;
}

export const SafeTextarea = ({ value, onValueChange, ...props }: SafeTextareaProps) => {
  const [innerValue, setInnerValue] = React.useState(value);
  const isComposing = React.useRef(false);

  React.useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInnerValue(val);
    if (!isComposing.current) {
      onValueChange(val);
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposing.current = false;
    // @ts-ignore
    onValueChange(e.target.value);
  };

  return (
    <textarea
      {...props}
      value={innerValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  );
};
