/*   +-------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                 |
     |---------+------------+------------+-------------------------------------------------------------+
     |  1.0    | J.Lejarza  |  18/03/21  | Creación del Suitelet                                       |
	 |---------+------------+------------+-------------------------------------------------------------+
     |   Suitelet de generación de asientos de liquidación.                                            |
     |    - Ventana de revisión de saldos a fecha y generación de los asientos correspondientes        |
     +---------+------------+------------+-------------------------------------------------------------+
     |  1.1    | I.Martinez |  11/04/23  | Liquidación de Modelos Impositivos - MultiOrg               |
     +---------+------------+------------+-------------------------------------------------------------+
     |  Añadir subsidiaria en el grid de liquidación                                                   |
     +---------+------------+------------+-------------------------------------------------------------+
*/

function onSuiteletLoad(request, response) 
{
    //Entrada a la aplicación. Ventana de búsqueda.
    if (request.getMethod() == 'GET') 
    {
        var form = crearPantallaGeneracionAsientos(request);

        response.writePage(form);
    }
}

//Función que crea la pantalla de búsqueda de saldos y creación de asientos
function crearPantallaGeneracionAsientos(request) 
{
    var form = nlapiCreateForm('');

    //Título de la pantalla
    form.setTitle('Liquidación de Modelos');

    //Obtener los parámetros recibidos en la llamada
    var parametros = {
        buscar: request.getParameter('buscar'),
        
        // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
        // Obtener la subsidiaria de la llamada
        subsidiariaFiltro: request.getParameter('subsidiariafiltro'),
        // FIN [IMI] arin#2023040310000685 . (11/04/2023)
        
        modeloFiltro: request.getParameter('modelofiltro'),
        fechaDesdeFiltro: request.getParameter('fechadesdefiltro'),
        fechaHastaFiltro: request.getParameter('fechahastafiltro')
    };

    //Subregión de filtros
    form.addFieldGroup('grpfiltros', 'Búsqueda');
    //Campos de la pantalla, región de filtros
    
    // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
    // Añadir la subsidiaria al formulario
    var subsidiariaFiltro = form.addField('subsidiariafiltro', 'select', 'Subsidiaria', 'subsidiary', 'grpfiltros').setLayoutType('normal','startcol');
    // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    var modeloFiltro = form.addField('modelofiltro', 'select', 'Modelo', 'customlist_arin_asli_modimpositivos', 'grpfiltros').setLayoutType('normal','startcol');
    var fechadesdefiltro = form.addField('fechadesdefiltro', 'date', 'Fecha Desde', null, 'grpfiltros').setLayoutType('startrow','startrow');
    var fechahastafiltro = form.addField('fechahastafiltro', 'date', 'Fecha Hasta', null, 'grpfiltros').setLayoutType('endrow');

    //Poner los valores de los filtros que se hayan recibido por parámetro

    // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
    // Valor por defecto a la subsidiaria
    subsidiariaFiltro.setDefaultValue(parametros.subsidiariaFiltro);
    // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    modeloFiltro.setDefaultValue(parametros.modeloFiltro);
    fechadesdefiltro.setDefaultValue(parametros.fechaDesdeFiltro);
    fechahastafiltro.setDefaultValue(parametros.fechaHastaFiltro);

    //Subregión de datos del asiento
    form.addFieldGroup('grpdatosasiento', 'Asiento a generar');
    var memoAsiento = form.addField('memoasiento', 'text', 'Memo', null, 'grpdatosasiento').setLayoutType('normal','startcol');
    var fechaAsiento = form.addField('fechaasiento', 'date', 'Fecha Asiento', null, 'grpdatosasiento');

    //Subregión de grid de resultados
    var gridLiquidacion = form.addSubList('gridliquidacion', 'list', 'Saldos a liquidar');

    //Botón de búsqueda
    gridLiquidacion.addButton('aplicarfiltros', 'Aplicar Filtros', 'aplicarFiltros');
    
    //Botón de generar asiento    
    form.addButton('generarasiento', 'Generar Asiento', 'generarAsiento');

    //Columnas del grid
    gridLiquidacion.addField('cuenta', 'text', 'Cuenta');
    gridLiquidacion.addField('cuentaid', 'integer', 'Cuenta ID').setDisplayType('hidden');  
    gridLiquidacion.addField('modeloid', 'integer', 'Cuenta ID').setDisplayType('hidden');  
    gridLiquidacion.addField('debe', 'currency', 'Debe');
    gridLiquidacion.addField('haber', 'currency', 'Haber');

    // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
    // Añadir la subsidiaria al grid
    gridLiquidacion.addField('subsidiariaid', 'integer', 'Subsidiaria').setDisplayType('hidden');
    // FIN [IMI] arin#2023040310000685 . (11/04/2023)

     //Si se ha aplicado el botón de aplicar filtros
     if(parametros.buscar == 'Y')
     {
        var saldos = obtenerSaldosLiquidacion(parametros);

        //Insertar los registros en el grid
        var linea = 1;
        for(var i in saldos)
        {
            var debe = saldos[i].getValue('debitamount',null,'sum');
            var haber = saldos[i].getValue('creditamount',null,'sum');
            if(debe > haber)
            {
                debe = debe - haber;
                haber = 0;
            }
            else
            {
                haber = haber - debe;
                debe = 0;
            }
            
            //Solo insertamos la línea si hay saldo debe o haber
            if(debe != 0 || haber != 0)
            {
                gridLiquidacion.setLineItemValue('cuentaid', linea, saldos[i].getValue('account',null,'group'));
                gridLiquidacion.setLineItemValue('cuenta', linea, saldos[i].getText('account',null,'group'));
                gridLiquidacion.setLineItemValue('modeloid', linea, saldos[i].getValue('custrecord_arin_asli_modimpositivo','account','group'));

                gridLiquidacion.setLineItemValue('debe', linea, debe);
                gridLiquidacion.setLineItemValue('haber', linea, haber);

                // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
                // Añadimos la linea al grid
                gridLiquidacion.setLineItemValue('subsidiariaid', linea, saldos[i].getValue('subsidiary',null,'group'));
                // FIN [IMI] arin#2023040310000685 . (11/04/2023)

                linea++;
            }
        }
     }

    //El nombre es el ID con el que se da de alta en netsuite
    form.setScript('customscript_arin_asli_asientosliquid_ce');
    
    return form;

}

function obtenerSaldosLiquidacion(params)
{
    var saldos = {};

    var filtros = new Array();
    
    filtros.push(new nlobjSearchFilter('custrecord_arin_asli_modimpositivo', 'account', 'anyof', params.modeloFiltro));
    
    // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
    // Nuevo filtro de búsqueda
    filtros.push(new nlobjSearchFilter('subsidiary', null, 'anyof', params.subsidiariaFiltro));
    // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    filtros.push(new nlobjSearchFilter('trandate', null, 'onOrAfter', params.fechaDesdeFiltro));
    filtros.push(new nlobjSearchFilter('trandate', null, 'onOrBefore', params.fechaHastaFiltro));

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn('account',null,'group').setSort());

    // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
    columnas.push(new nlobjSearchColumn('subsidiary',null,'group').setSort());
    // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    columnas.push(new nlobjSearchColumn('custrecord_arin_asli_modimpositivo','account','group').setSort());
    columnas.push(new nlobjSearchColumn('debitamount',null, 'sum'));
    columnas.push(new nlobjSearchColumn('creditamount',null, 'sum'));

    saldos = nlapiSearchRecord('transaction', 'customsearch_arin_asli_pantliquidacion', filtros, columnas);
    
    return saldos;

}