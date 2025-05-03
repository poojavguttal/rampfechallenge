import Downshift from "downshift";
import { useCallback, useState, useEffect, useRef } from "react";
import classNames from "classnames";
import {
  DropdownPosition,
  GetDropdownPositionFn,
  InputSelectOnChange,
  InputSelectProps,
} from "./types";

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(
    defaultValue ?? null
  );
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) {
        return;
      }
      consumerOnChange(selectedItem);
      setSelectedValue(selectedItem);
    },
    [consumerOnChange]
  );

  // Function to update position of both filter box and dropdown
  const updatePosition = () => {
    if (containerRef.current && dropdownRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dropdownRef.current.style.top = `${window.scrollY + rect.bottom}px`;
      dropdownRef.current.style.left = `${rect.left}px`;
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue,
      }) => {
        const toggleProps = getToggleButtonProps();
        const parsedSelectedItem =
          selectedItem === null ? null : parseItem(selectedItem);

        return (
          <div className="RampInputSelect--container" ref={containerRef}>
            <label
              className="RampText--s RampText--hushed"
              {...getLabelProps()}
            >
              {label}
            </label>
            <div className="RampBreak--xs" />
            <div
              className="RampInputSelect--input"
              onClick={(event) => {
                updatePosition();
                toggleProps.onClick(event);
              }}
            >
              {inputValue}
            </div>

            {isOpen && (
              <div
                ref={dropdownRef}
                className={classNames("RampInputSelect--dropdown-container", {
                  "RampInputSelect--dropdown-container-opened": isOpen,
                })}
                {...getMenuProps()}
                style={{ position: "absolute", width: "100%" }}
              >
                {renderItems()}
              </div>
            )}
          </div>
        );

        function renderItems() {
          if (!isOpen) {
            return null;
          }

          if (isLoading) {
            return (
              <div className="RampInputSelect--dropdown-item">
                {loadingLabel}...
              </div>
            );
          }

          if (items.length === 0) {
            return (
              <div className="RampInputSelect--dropdown-item">No items</div>
            );
          }

          return items.map((item, index) => {
            const parsedItem = parseItem(item);
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted":
                      highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      parsedSelectedItem?.value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            );
          });
        }
      }}
    </Downshift>
  );
}
