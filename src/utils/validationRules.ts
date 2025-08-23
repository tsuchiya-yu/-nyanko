import { RegisterOptions } from 'react-hook-form';

export const profPathIdRules: RegisterOptions = {
  required: 'プロフィールURLは必須です',
  pattern: {
    value: /^[a-zA-Z0-9_-]+$/,
    message: 'プロフィールURLには半角英数字、ハイフン（-）、アンダースコア（_）のみ使用できます',
  },
  maxLength: {
    value: 50,
    message: 'プロフィールURLは50文字以内で入力してください',
  },
  validate: (value: string) => {
    if (value.length < 3) {
      return 'プロフィールURLは3文字以上で入力してください';
    }
    if (value.startsWith('-') || value.startsWith('_')) {
      return 'プロフィールURLは英数字で始める必要があります';
    }
    if (value.endsWith('-') || value.endsWith('_')) {
      return 'プロフィールURLは英数字で終える必要があります';
    }
    return true;
  },
};
