import React from 'react';
import type { LayoutNode } from '../../utils/layout';

export interface IfRendererProps {
    layout: LayoutNode;
    renderChild: (layout: LayoutNode) => React.ReactNode;
}
