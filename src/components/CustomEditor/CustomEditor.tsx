import React, { useCallback, useMemo } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { CodeEditor, CodeEditorSuggestionItem, CodeEditorSuggestionItemKind } from '@grafana/ui';
import { CodeLanguage, EditorType, Format, HelpersEditorSuggestions, TestIds } from '../../constants';

/**
 * Monaco
 */
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Properties
 */
interface Props extends StandardEditorProps {
  type?: EditorType;
}

/**
 * Custom Editor
 */
export const CustomEditor: React.FC<Props> = ({ value, onChange, context, type = EditorType.TEXT }) => {
  /**
   * Template Service to get Variables
   */
  const templateSrv = getTemplateSrv();

  /**
   * Format On Mount
   */
  const onEditorMount = useCallback(
    (editor: monacoType.editor.IStandaloneCodeEditor) => {
      if (context.options.editor.format !== Format.AUTO) {
        return;
      }

      setTimeout(() => {
        editor.getAction('editor.action.formatDocument').run();
      }, 100);
    },
    [context.options.editor.format]
  );

  /**
   * Suggestions
   */
  const getSuggestions = useCallback((): CodeEditorSuggestionItem[] => {
    if (type === EditorType.TEXT) {
      return [];
    }

    /**
     * Add Variables
     */
    const suggestions = templateSrv.getVariables().map((variable) => {
      return {
        label: `\$\{${variable.name}\}`,
        kind: CodeEditorSuggestionItemKind.Property,
        detail: variable.description ? variable.description : variable.label,
      };
    });

    if (type === EditorType.STYLES) {
      return suggestions;
    }

    return HelpersEditorSuggestions.concat(suggestions);
  }, [templateSrv, type]);

  /**
   * Format Options
   */
  const monacoOptions = useMemo(() => {
    return context.options.editor.format === Format.AUTO
      ? { formatOnPaste: true, formatOnType: true }
      : { formatOnPaste: false, formatOnType: false };
  }, [context.options.editor.format]);

  /**
   * Language
   */
  const language = useMemo(() => {
    if (type === EditorType.HELPERS) {
      return CodeLanguage.JAVASCRIPT;
    }

    if (type === EditorType.STYLES) {
      return CodeLanguage.SCSS;
    }

    return context.options.editor.language;
  }, [context.options.editor.language, type]);

  return (
    <div data-testid={TestIds.textEditor.root}>
      <CodeEditor
        language={language}
        showLineNumbers={true}
        showMiniMap={(value && value.length) > 100}
        value={value}
        height={`${context.options.editor.height}px`}
        onBlur={onChange}
        onSave={onChange}
        monacoOptions={monacoOptions}
        onEditorDidMount={onEditorMount}
        getSuggestions={getSuggestions}
      />
    </div>
  );
};

/**
 * Text Editor
 * @param props
 * @constructor
 */
export const TextEditor: React.FC<StandardEditorProps> = (props) => <CustomEditor {...props} type={EditorType.TEXT} />;

/**
 * Helpers Editor
 * @param props
 * @constructor
 */
export const HelpersEditor: React.FC<StandardEditorProps> = (props) => (
  <CustomEditor {...props} type={EditorType.HELPERS} />
);

/**
 * Styles Editor
 * @param props
 * @constructor
 */
export const StylesEditor: React.FC<StandardEditorProps> = (props) => (
  <CustomEditor {...props} type={EditorType.STYLES} />
);
