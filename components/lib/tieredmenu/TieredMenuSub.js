import * as React from 'react';
import { useEventListener, useMountEffect, useResizeListener, useUpdateEffect } from '../hooks/Hooks';
import { Ripple } from '../ripple/Ripple';
import { classNames, DomHandler, IconUtils, ObjectUtils } from '../utils/Utils';
import { AngleRightIcon } from '../icons/angleright';

export const TieredMenuSub = React.memo((props) => {
    const [activeItemState, setActiveItemState] = React.useState(null);
    const elementRef = React.useRef(null);

    const [bindDocumentClickListener] = useEventListener({
        type: 'click',
        listener: (event) => {
            if (!props.isMobileMode && elementRef.current && !elementRef.current.contains(event.target)) {
                setActiveItemState(null);
            }
        }
    });

    const [bindDocumentResizeListener] = useResizeListener({
        listener: () => {
            !props.isMobileMode && setActiveItemState(null);
        }
    });

    const position = () => {
        if (elementRef.current) {
            const parentItem = elementRef.current.parentElement;
            const containerOffset = DomHandler.getOffset(parentItem);
            const viewport = DomHandler.getViewport();
            const sublistWidth = elementRef.current.offsetParent ? elementRef.current.offsetWidth : DomHandler.getHiddenElementOuterWidth(elementRef.current);
            const itemOuterWidth = DomHandler.getOuterWidth(parentItem.children[0]);
            const top = parseInt(containerOffset.top, 10) + elementRef.current.offsetHeight - DomHandler.getWindowScrollTop();

            if (top > viewport.height) {
                elementRef.current.style.top = viewport.height - top + 'px';
            } else {
                elementRef.current.style.top = '0px';
            }

            if (parseInt(containerOffset.left, 10) + itemOuterWidth + sublistWidth > viewport.width - DomHandler.calculateScrollbarWidth()) {
                DomHandler.addClass(elementRef.current, 'p-submenu-list-flipped');
            }
        }
    };

    const onItemMouseEnter = (event, item) => {
        if (item.disabled || props.isMobileMode) {
            event.preventDefault();

            return;
        }

        if (props.root) {
            if (activeItemState || props.popup) {
                setActiveItemState(item);
            }
        } else {
            setActiveItemState(item);
        }
    };

    const onItemClick = (event, item) => {
        if (item.disabled) {
            event.preventDefault();

            return;
        }

        if (!item.url) {
            event.preventDefault();
        }

        if (item.command) {
            item.command({
                originalEvent: event,
                item: item
            });
        }

        if (props.root || props.isMobileMode) {
            if (item.items) {
                if (activeItemState && item === activeItemState) setActiveItemState(null);
                else setActiveItemState(item);
            }
        }

        if (!item.items) {
            onLeafClick(event);
        }
    };

    const onItemKeyDown = (event, item) => {
        let listItem = event.currentTarget.parentElement;

        switch (event.which) {
            //down
            case 40:
                const nextItem = findNextItem(listItem);

                nextItem && nextItem.children[0].focus();
                event.preventDefault();
                break;

            //up
            case 38:
                const prevItem = findPrevItem(listItem);

                prevItem && prevItem.children[0].focus();
                event.preventDefault();
                break;

            //right
            case 39:
                if (item.items) {
                    setActiveItemState(item);

                    setTimeout(() => {
                        listItem.children[1].children[0].children[0].focus();
                    }, 50);
                }

                event.preventDefault();
                break;

            default:
                break;
        }

        props.onKeyDown && props.onKeyDown(event, listItem);
    };

    const onChildItemKeyDown = (event, childListItem) => {
        //left
        if (event.which === 37) {
            setActiveItemState(null);
            childListItem.parentElement.previousElementSibling.focus();
        }
    };

    const findNextItem = (item) => {
        const nextItem = item.nextElementSibling;

        return nextItem ? (DomHandler.hasClass(nextItem, 'p-disabled') || !DomHandler.hasClass(nextItem, 'p-menuitem') ? findNextItem(nextItem) : nextItem) : null;
    };

    const findPrevItem = (item) => {
        const prevItem = item.previousElementSibling;

        return prevItem ? (DomHandler.hasClass(prevItem, 'p-disabled') || !DomHandler.hasClass(prevItem, 'p-menuitem') ? findPrevItem(prevItem) : prevItem) : null;
    };

    const onLeafClick = (event) => {
        if (!props.isMobileMode || props.popup) {
            setActiveItemState(null);
            props.onLeafClick && props.onLeafClick(event);
            props.onHide && props.onHide(event);
        }
    };

    useMountEffect(() => {
        bindDocumentClickListener();
        bindDocumentResizeListener();
    });

    useUpdateEffect(() => {
        if (!props.parentActive) {
            setActiveItemState(null);
        }

        if (!props.root && props.parentActive && !props.isMobileMode) {
            position();
        }
    }, [props.parentActive]);

    useUpdateEffect(() => {
        props.onItemToggle && props.onItemToggle();
    }, [activeItemState]);

    const createSeparator = (index) => {
        const key = 'separator_' + index;

        return <li key={key} className="p-menu-separator" role="separator"></li>;
    };

    const createSubmenu = (item) => {
        if (item.items) {
            return (
                <TieredMenuSub
                    menuProps={props.menuProps}
                    model={item.items}
                    onLeafClick={onLeafClick}
                    popup={props.popup}
                    onKeyDown={onChildItemKeyDown}
                    parentActive={item === activeItemState}
                    isMobileMode={props.isMobileMode}
                    onItemToggle={props.onItemToggle}
                    submenuIcon={props.submenuIcon}
                />
            );
        }

        return null;
    };

    const createMenuItem = (item, index) => {
        if (item.visible === false) {
            return null;
        }

        const { id, className: _className, style, disabled, icon: _icon, label: _label, items, target, url, template } = item;
        const key = _label + '_' + index;
        const active = activeItemState === item;
        const className = classNames('p-menuitem', { 'p-menuitem-active': active }, _className);
        const linkClassName = classNames('p-menuitem-link', { 'p-disabled': disabled });
        const iconClassName = classNames('p-menuitem-icon', _icon);
        const icon = IconUtils.getJSXIcon(_icon, { className: 'p-menuitem-icon' }, { props: props.menuProps });
        const label = _label && <span className="p-menuitem-text">{_label}</span>;
        const submenuIconClassName = 'p-submenu-icon';
        const submenuIcon = item.items && IconUtils.getJSXIcon(props.submenuIcon || <AngleRightIcon className={submenuIconClassName} />, { className: submenuIconClassName }, { props: props.menuProps });
        const submenu = createSubmenu(item);
        let content = (
            <a href={url || '#'} className={linkClassName} target={target} role="menuitem" aria-haspopup={items != null} onClick={(event) => onItemClick(event, item)} onKeyDown={(event) => onItemKeyDown(event, item)} aria-disabled={disabled}>
                {icon}
                {label}
                {submenuIcon}
                <Ripple />
            </a>
        );

        if (template) {
            const defaultContentOptions = {
                onClick: (event) => onItemClick(event, item),
                onKeyDown: (event) => onItemKeyDown(event, item),
                className: linkClassName,
                labelClassName: 'p-menuitem-text',
                iconClassName,
                submenuIconClassName,
                element: content,
                props,
                active,
                disabled
            };

            content = ObjectUtils.getJSXElement(template, item, defaultContentOptions);
        }

        return (
            <li key={key} id={item.id} className={className} style={style} onMouseEnter={(event) => onItemMouseEnter(event, item)} role="none">
                {content}
                {submenu}
            </li>
        );
    };

    const createItem = (item, index) => {
        return item.separator ? createSeparator(index) : createMenuItem(item, index);
    };

    const createMenu = () => {
        return props.model ? props.model.map(createItem) : null;
    };

    const className = classNames({
        'p-submenu-list': !props.root
    });
    const submenu = createMenu();

    return (
        <ul ref={elementRef} className={className} role={props.root ? 'menubar' : 'menu'} aria-orientation="horizontal">
            {submenu}
        </ul>
    );
});

TieredMenuSub.displayName = 'TieredMenuSub';
