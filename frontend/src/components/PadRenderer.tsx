import React from 'react';
import type { PadNode } from '../types';
import '../Pad.css';

interface PadRendererProps {
    node: PadNode;
}

export const PadRenderer: React.FC<PadRendererProps> = ({ node }) => {
    switch (node.type) {
        case 'sequence':
            return <SequenceRenderer childrenNodes={node.children} />;
        case 'block':
            return <BlockRenderer label={node.label} childrenNodes={node.children} />;
        case 'if':
            return <IfRenderer condition={node.condition} thenBlock={node.then_block} elseBlock={node.else_block} />;
        case 'loop':
            return <LoopRenderer condition={node.condition} body={node.body} />;
        case 'command':
            return <CommandRenderer label={node.label} />;
        case 'error':
            return <div className="pad-error">Error: {node.message}</div>;
        default:
            return <div>Unknown node type</div>;
    }
};

const SequenceRenderer: React.FC<{ childrenNodes: PadNode[] }> = ({ childrenNodes }) => {
    return (
        <div className="pad-sequence">
            {childrenNodes.map((child, index) => (
                <PadRenderer key={index} node={child} />
            ))}
        </div>
    );
};

const BlockRenderer: React.FC<{ label: string; childrenNodes: PadNode[] }> = ({ label, childrenNodes }) => {
    return (
        <div className="pad-block">
            <div className="pad-block-label">{label}</div>
            <div className="pad-block-content">
                <SequenceRenderer childrenNodes={childrenNodes} />
            </div>
        </div>
    )
}

const CommandRenderer: React.FC<{ label: string }> = ({ label }) => {
    return (
        <div className="pad-command">
            {label}
        </div>
    );
};

const IfRenderer: React.FC<{ condition: string; thenBlock: PadNode; elseBlock?: PadNode }> = ({ condition, thenBlock, elseBlock }) => {
    return (
        <div className="pad-if">
            <div className="pad-if-condition">
                {condition} ?
            </div>
            <div className="pad-if-branches">
                <div className="pad-if-branch">
                    <div className="pad-if-branch-label">True</div>
                    <div className="pad-if-branch-content">
                        <PadRenderer node={thenBlock} />
                    </div>
                </div>
                {elseBlock && (
                    <div className="pad-if-branch">
                        <div className="pad-if-branch-label">False</div>
                        <div className="pad-if-branch-content">
                            <PadRenderer node={elseBlock} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoopRenderer: React.FC<{ condition: string; body: PadNode }> = ({ condition, body }) => {
    return (
        <div className="pad-loop">
            <div className="pad-loop-condition">
                {condition}
            </div>
            <div className="pad-loop-body">
                <PadRenderer node={body} />
            </div>
        </div>
    )
}
