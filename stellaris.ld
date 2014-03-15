MEMORY
{
FLASH (rx) : ORIGIN = 0x00000000, LENGTH = 256K
SRAM (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}

/* !!  Needs to adjusted  !! */
STACK_SIZE = 16K;
HEAP_SIZE = 32K;

SECTIONS
{
    .text :
    {
        KEEP(*(.isr_vector))

        *(.text .text.* .gnu.linkonce.t.*)
        *(.rodata .rodata.* .gnu.linkonce.r.*)
/*
        *(.eh_frame_hdr)
        *(.eh_frame)
        *(.ARM.extab* .gnu.linkonce.armextab.*)
        *(.gcc_except_table)
        *(.eh_frame_hdr)
        *(.eh_frame)
*/
        . = ALIGN(4);
        KEEP(*(.init))

            . = ALIGN(4);
        __preinit_array_start = .;
        KEEP (*(.preinit_array))
        __preinit_array_end = .;

        . = ALIGN(4);
        __init_array_start = .;
        KEEP (*(SORT(.init_array.*)))
        KEEP (*(.init_array))
        __init_array_end = .;

        . = ALIGN(0x4);
        _ctor_start = .;
        KEEP (*crtbegin.o(.ctors))
        KEEP (*(EXCLUDE_FILE (*crtend.o) .ctors))
        KEEP (*(SORT(.ctors.*)))
        KEEP (*crtend.o(.ctors))
        _ctor_end = .;

        . = ALIGN(4);
        KEEP(*(.fini))

        . = ALIGN(4);
        __fini_array_start = .;
        KEEP (*(.fini_array))
        KEEP (*(SORT(.fini_array.*)))
        __fini_array_end = .;

        KEEP (*crtbegin.o(.dtors))
        KEEP (*(EXCLUDE_FILE (*crtend.o) .dtors))
        KEEP (*(SORT(.dtors.*)))
        KEEP (*crtend.o(.dtors))

        . = ALIGN(8);
        _etext = .;

    } >FLASH

    /* .ARM.exidx is sorted, so has to go in its own output section. */
/*
    __exidx_start = .;
    .ARM.exidx :
    {
        *(.ARM.exidx* .gnu.linkonce.armexidx.*)
    } >FLASH
    __exidx_end = .;
*/

    _flash_data = .;
    .data : AT (_flash_data)
    {
        _data = .;
        *(vtable)
        *(.data*)
        _edata = .;
    } > SRAM

    .bss :
    {
        _bss = .;
        *(.bss*)
        *(COMMON)
        _ebss = .;
        _end = .;
        __end = .;
    } > SRAM

    .stack : {
        _stack = . ;
        . = . + STACK_SIZE;
        . = ALIGN(8);
        __c_stack_top__ = . ;
        _estack = . ;
    } >SRAM

    .heap : {
        _heap = . ;
        . = . + HEAP_SIZE;
        . = ALIGN(8);
        _eheap = . ;
    } >SRAM
}

/* end of allocated ram _end */
/* PROVIDE( _heap = _end ); */

/* end of the heap -> align 8 byte */
/* PROVIDE ( _eheap = ALIGN(ORIGIN(SRAM) + LENGTH(SRAM) - 8 ,8) ); */

