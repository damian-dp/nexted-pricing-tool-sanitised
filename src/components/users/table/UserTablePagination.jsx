import React from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination";

export function UserTablePagination({ table }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <p
                className="flex-1 whitespace-nowrap text-sm text-muted-foreground"
                aria-live="polite"
            >
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </p>
            <p className="text-sm text-muted-foreground">
                Page{" "}
                <span className="text-foreground">
                    {table.getState().pagination.pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="text-foreground">{table.getPageCount()}</span>
            </p>
            <Pagination className="w-auto">
                <PaginationContent className="gap-3">
                    <PaginationItem>
                        <Button
                            variant="outline"
                            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            aria-label="Go to previous page"
                        >
                            Previous
                        </Button>
                    </PaginationItem>
                    <PaginationItem>
                        <Button
                            variant="outline"
                            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            aria-label="Go to next page"
                        >
                            Next
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}

UserTablePagination.propTypes = {
    table: PropTypes.object.isRequired,
};
