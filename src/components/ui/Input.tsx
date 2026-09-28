import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(errorMessage);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-neutral-300 tracking-wide select-none"
          >
            {label}
            {props.required && <span className="text-purple-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-[#0D1322] border rounded-xl py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} ${
              hasError
                ? 'border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                : 'border-neutral-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-neutral-600'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {hasError ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-400 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1 cursor-pointer"
            aria-label={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, errorMessage, className = '', id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(errorMessage);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-neutral-300 tracking-wide select-none"
          >
            {label}
            {props.required && <span className="text-purple-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={`w-full bg-[#0D1322] border rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 transition-all duration-150 outline-none resize-y min-h-[90px] disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError
              ? 'border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
              : 'border-neutral-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-neutral-600'
          } ${className}`}
          {...props}
        />
        {hasError ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-400 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, options, className = '', id, children, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-neutral-300 tracking-wide select-none"
          >
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`w-full bg-[#0D1322] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 transition-all duration-150 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-neutral-600 cursor-pointer ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {helperText && <p className="text-[11px] text-neutral-400 leading-normal">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <label className={`flex items-start gap-3 select-none cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
          checked ? 'bg-purple-600' : 'bg-neutral-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-neutral-200">{label}</span>}
          {description && <span className="text-[11px] text-neutral-400">{description}</span>}
        </div>
      )}
    </label>
  );
};
