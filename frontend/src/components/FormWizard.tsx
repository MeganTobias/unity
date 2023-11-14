import React, { useState } from 'react';
import FormStep from './FormStep';
import FormProgress from './FormProgress';
import Button from './Button';

interface FormWizardProps {
  children: React.ReactNode;
  onComplete?: (data: any) => void;
  onStepChange?: (step: number) => void;
  showProgress?: boolean;
  showNavigation?: boolean;
  allowStepNavigation?: boolean;
  className?: string;
}

const FormWizard: React.FC<FormWizardProps> = ({
  children,
  onComplete,
  onStepChange,
  showProgress = true,
  showNavigation = true,
  allowStepNavigation = true,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<any>({});

  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setCompletedSteps(prev => [...prev, currentStep]);
      onStepChange?.(newStep);
    } else {
      onComplete?.(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (allowStepNavigation && stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  const updateFormData = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.includes(stepIndex);
  };

  const isStepActive = (stepIndex: number) => {
    return stepIndex === currentStep;
  };

  const isStepDisabled = (stepIndex: number) => {
    return !allowStepNavigation && stepIndex > currentStep;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {showProgress && (
        <FormProgress
          currentStep={currentStep + 1}
          totalSteps={totalSteps}
          variant="default"
          size="md"
        />
      )}
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <FormStep
            key={index}
            stepNumber={index + 1}
            title={`Step ${index + 1}`}
            isActive={isStepActive(index)}
            isCompleted={isStepCompleted(index)}
            isDisabled={isStepDisabled(index)}
            onStepClick={() => handleStepClick(index)}
          >
            {React.cloneElement(step as React.ReactElement, {
              onDataChange: updateFormData,
              formData
            })}
          </FormStep>
        ))}
      </div>
      
      {showNavigation && (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
          >
            {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FormWizard;

