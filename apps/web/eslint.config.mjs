import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';

const logicalCssPlugin = {
  rules: {
    'no-physical-direction': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ban physical-direction CSS classes in favor of CSS logical properties',
        },
        schema: [],
        messages: {
          banned:
            'Avoid physical direction utility "{{className}}". Use CSS logical properties (ms-, me-, ps-, pe-, start-, end-, text-start, text-end) instead.',
        },
      },
      create(context) {
        const PHYSICAL_REGEX =
          /\b(ml-[^\s"'\`]+|mr-[^\s"'\`]+|pl-[^\s"'\`]+|pr-[^\s"'\`]+|left-[^\s"'\`]+|right-[^\s"'\`]+|text-left|text-right)\b/g;

        function checkString(str, node) {
          if (typeof str !== 'string') return;
          const matches = str.match(PHYSICAL_REGEX);
          if (matches) {
            for (const match of matches) {
              context.report({
                node,
                messageId: 'banned',
                data: { className: match },
              });
            }
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name && (node.name.name === 'className' || node.name.name === 'class')) {
              if (node.value && node.value.type === 'Literal') {
                checkString(node.value.value, node.value);
              } else if (node.value && node.value.type === 'JSXExpressionContainer') {
                const expr = node.value.expression;
                if (expr.type === 'Literal') {
                  checkString(expr.value, expr);
                } else if (expr.type === 'TemplateLiteral') {
                  for (const quasi of expr.quasis) {
                    checkString(quasi.value.raw, quasi);
                  }
                }
              }
            }
          },
        };
      },
    },
  },
};

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'logical-css': logicalCssPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'logical-css/no-physical-direction': 'error',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
];
