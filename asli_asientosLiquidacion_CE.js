/*   +-------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                 |
     |---------+------------+------------+-------------------------------------------------------------+
     |  1.0    | J.Lejarza  |  18/03/21  | Creación de los eventos de cliente                          |
	 |---------+------------+------------+-------------------------------------------------------------+
     |   Eventos de cliente para el suitelet asli_asientosLiquidacion_SL.                              |    
     +---------+------------+------------+-------------------------------------------------------------+
     |  1.1    | I.Martinez |  11/04/23  | Liquidación de Modelos Impositivos - MultiOrg               |
     +---------+------------+------------+-------------------------------------------------------------+
     |  Añadir subsidiaria en el grid de liquidación                                                   |
     +---------+------------+------------+-------------------------------------------------------------+
*/

function onPageInit(type){

    return true;
}

function onSaveRecord(){

    return true;
}

function onValidateField(type, name, linenum){

    return true;
}

function onFieldChange(type, name, linenum){
    
    return true;
}

function onPostSourcing(type, name){

    return true;
}

function onLineInit(type){

    return true;
}

function onValidateLine(type){

    return true;
}

function onValidateInsert(type){

    return true;
}

function onValidateDelete(type){

    return true;
}
function onRecalc(type){

    return true;
}

function aplicarFiltros()
{
    //Validar que se hayan informado o el filtro de cliente o el de oportunidad
    if(!nlapiGetFieldValue('modelofiltro') || !nlapiGetFieldValue('fechadesdefiltro') || !nlapiGetFieldValue('fechahastafiltro')
        // INICIO [IMI] arin#2023040310000685 . (11/04/2023)
        // La subsidiaria también es obligatoria
        || !nlapiGetFieldValue('subsidiariafiltro'))
        // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    {
        // INICIO [IMI] arin#2023040310000685 . (11/04/2023)
        //alert('Es obligatorio indicar los filtros de modelo y fechas.');   
        alert('Es obligatorio indicar los filtros de modelo, subsidiaria y fechas.');   
        // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    }
    else
    {
        //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
        window.onbeforeunload = null;
        
        //El segundo parámetro es el ID del script del suitelet y el tercero el del deploy.
        var url = window.location.origin + nlapiResolveURL('SUITELET', 'customscript_arin_asli_asientosliquid_sl', 'customdeploy_arin_asli_asientosliquid_sl');
        
        //Indicar que hay que buscar las oportunidades al cargar la pantalla
        url += '&buscar=Y';
        //Añadir a la llamada todos los parámetros informados de la pantalla
        if (!!nlapiGetFieldValue('modelofiltro')) url += '&modelofiltro=' + nlapiGetFieldValue('modelofiltro');
        if (!!nlapiGetFieldValue('fechadesdefiltro')) url += '&fechadesdefiltro=' + nlapiGetFieldValue('fechadesdefiltro');
        if (!!nlapiGetFieldValue('fechahastafiltro')) url += '&fechahastafiltro=' + nlapiGetFieldValue('fechahastafiltro');

        // INICIO [IMI] arin#2023040310000685 . (11/04/2023)
        // Pasar la subsidiaria en la url
        if (!!nlapiGetFieldValue('subsidiariafiltro')) url += '&subsidiariafiltro=' + nlapiGetFieldValue('subsidiariafiltro');;
        // FIN [IMI] arin#2023040310000685 . (11/04/2023)

        //Recargar la pantalla
        window.open(url, '_self');        
    } 
}

function generarAsiento()
{
    nlapiLogExecution('DEBUG','generarAsientos()','Inicio');
    nlapiLogExecution('DEBUG','generarAsientos()', 'Validaciones');
    //Validar que haya líneas en la cuadrícula para las que se creará el asiento
    if(nlapiGetLineItemCount('gridliquidacion') == 0 )
    {
        alert('No se han recuperado líneas para generar el asiento.');
        return;
    }
    if(!nlapiGetFieldValue('memoasiento'))
    {
        alert('No se ha indicado un memo para el asiento.');
        return;
    }
    if(!nlapiGetFieldValue('fechaasiento'))
    {
        alert('No se ha indicado una fecha para el asiento.');
        return;
    }
    else if(comprobarPeriodoCerrado(nlapiGetFieldValue('fechaasiento')) == 'T')
         {
            alert('La fecha indicada pertenece a un periodo cerrado.');
            return;
         }
    
    if (!confirm('Se va a generar el asiento de liquidación. ¿Desea continuar?')) return;
    nlapiLogExecution('DEBUG','generarAsientos()', 'Aceptar confirmación.');

    //Avisar creando asiento
    var alerta = document.createElement("div");
    alerta.id = 'alertaCreandoAsiento';
    alerta.innerHTML = '<div id="div_alertaCreandoAsiento"><div style="" class="uir-alert-box alert" width="100%" role="status">' +
    '<div class="icon alert"></div><div class="content"><div class="title">Creando asiento de liquidación</div>' +
    '<div class="descr">Procesando. Por favor, no cierre la pestaña.</div></div></div></div>';
    document.getElementById('div__title').parentElement.insertBefore(alerta, document.getElementById('div__title'));

    var modeloId = nlapiGetLineItemValue('gridliquidacion','modeloid',1);
    nlapiLogExecution('DEBUG','generarAsientos()', 'Modelo: ' + modeloId);
    var debeTotal = 0;
    var haberTotal = 0;
    
    //Crear el asiento con las líneas recuperadas por pantalla
    var nuevoJournalEntry = nlapiCreateRecord('JournalEntry');

    // INICIO [IMI] arin#2023040310000685 . (11/04/2023) 
    // Generar el asiento recuperando la subsidiaria
    nuevoJournalEntry.setFieldValue('subsidiary',nlapiGetLineItemValue('gridliquidacion','subsidiariaid',1));
    // FIN [IMI] arin#2023040310000685 . (11/04/2023)

    nuevoJournalEntry.setFieldValue('memo',nlapiGetFieldValue('memoasiento'));
    nuevoJournalEntry.setFieldValue('trandate',nlapiGetFieldValue('fechaasiento'));
    nuevoJournalEntry.setFieldValue('custbody_arin_asli_modeloliquidacion',modeloId);

    for(var linea = 1; linea <= nlapiGetLineItemCount('gridliquidacion'); linea++)
    {
        //En el asiento se genera con el saldo opuesto. Por tanto lo que tenga la cuenta en el debe irá al haber y viceversa.
        var haber = parseFloat(parseFloat(nlapiGetLineItemValue('gridliquidacion','debe',linea)).toFixed(2));
        var debe = parseFloat(parseFloat(nlapiGetLineItemValue('gridliquidacion','haber',linea)).toFixed(2));
        //Línea Asiento
        nuevoJournalEntry.selectNewLineItem('line');
        nuevoJournalEntry.setCurrentLineItemValue('line','account',nlapiGetLineItemValue('gridliquidacion','cuentaid',linea));
        nuevoJournalEntry.setCurrentLineItemValue('line','debit',debe);
        nuevoJournalEntry.setCurrentLineItemValue('line','credit',haber);
        nuevoJournalEntry.setCurrentLineItemValue('line','memo',nlapiGetFieldValue('memoasiento'));
        nuevoJournalEntry.commitLineItem('line');

        debeTotal += debe;
        haberTotal += haber;

        nlapiLogExecution('DEBUG','generarAsientos()', 'Línea asiento ' + linea);
        nlapiLogExecution('DEBUG','generarAsientos()', 'Cuenta: ' + nlapiGetLineItemValue('gridliquidacion','cuentaid',linea));
        nlapiLogExecution('DEBUG','generarAsientos()', 'Debe: ' + debe);
        nlapiLogExecution('DEBUG','generarAsientos()', 'Haber: ' + haber);
    }

    debeTotal = parseFloat(debeTotal.toFixed(2));
    haberTotal = parseFloat(haberTotal.toFixed(2));

    nlapiLogExecution('DEBUG','generarAsientos()', 'Debe total: ' + debeTotal);
    nlapiLogExecution('DEBUG','generarAsientos()', 'Haber total: ' + haberTotal);

    //Si el asiento no cuadra hay que añadir una nueva línea con la diferencia
    if(debeTotal != haberTotal)
    {
        var debeDiferencia = 0;
        var haberDiferencia = 0;

        if(debeTotal > haberTotal)
        {
            haberDiferencia = parseFloat((debeTotal - haberTotal).toFixed(2));
            debeDiferencia = 0;
        }
        else
        {
            debeDiferencia = parseFloat((haberTotal - debeTotal).toFixed(2));
            haberDiferencia = 0;
        }

        //Obtener las cuentas para realizar la diferencia        
        var cuentasDiferencia = getCuentasModelo(modeloId);
        if(!!cuentasDiferencia && cuentasDiferencia.length > 0)
        {
            var cuentaDiferencia;
            if(haberDiferencia != 0)
            {
                cuentaDiferencia = cuentasDiferencia[0].getValue('custrecord_arin_asli_cuentahaber');
                if(!cuentaDiferencia) 
                {
                    alert('Este modelo no tiene configuradas la cuenta de haber para la línea de cuadre del asiento.');
                    aplicarFiltros();
                    return;
                }
            }
            else
            {
                cuentaDiferencia = cuentasDiferencia[0].getValue('custrecord_arin_asli_cuentadebe');
                if(!cuentaDiferencia) 
                {
                    alert('Este modelo no tiene configuradas la cuenta de debe para la línea de cuadre del asiento.');
                    aplicarFiltros();
                    return;
                }
            }
            nlapiLogExecution('DEBUG','generarAsientos()', 'Cuenta diferencia: ' + cuentaDiferencia);
            nlapiLogExecution('DEBUG','generarAsientos()', 'Debe diferencia: ' + debeDiferencia);
            nlapiLogExecution('DEBUG','generarAsientos()', 'Haber diferencia: ' + haberDiferencia);

            //Línea de cuadre de Asiento
            nuevoJournalEntry.selectNewLineItem('line');
            nuevoJournalEntry.setCurrentLineItemValue('line','account',cuentaDiferencia);
            nuevoJournalEntry.setCurrentLineItemValue('line','debit',debeDiferencia);
            nuevoJournalEntry.setCurrentLineItemValue('line','credit',haberDiferencia);
            nuevoJournalEntry.setCurrentLineItemValue('line','memo',nlapiGetFieldValue('memoasiento'));
            nuevoJournalEntry.commitLineItem('line');
        }
        else
        {
            alert('Este modelo no tiene configuradas las cuentas para la línea de cuadre del asiento.');
            aplicarFiltros();
            return;
        }
    }

    nlapiLogExecution('DEBUG','generarAsientos()', 'Antes de submit');
    var asientoId;

    try
    {
        asientoId = nlapiSubmitRecord(nuevoJournalEntry, true, false);
    }
    catch(e)
    {
        nlapiLogExecution('ERROR','Error al generar el asiento de liquidación: ', e.message);
        alert('Error al generar el asiento de liquidación: ' + e.message);        
        aplicarFiltros();
        return;
    }

    nlapiLogExecution('DEBUG','generarAsientos()', 'Asiento generado: ' + asientoId);

    //Abrir el asiento generado
    var url = nlapiResolveURL('RECORD', 'JournalEntry', asientoId, 'VIEW');
    //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
    window.onbeforeunload = null;
    window.location.href = url;

    nlapiLogExecution('DEBUG','generarAsientos()','Fin');
}

function getCuentasModelo(modeloId)
{
    var cuentas = {};

    var filtros = new Array();
    
    filtros.push(new nlobjSearchFilter('custrecord_arin_asli_modelo', null, 'anyof', modeloId));

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn('custrecord_arin_asli_cuentadebe'));
    columnas.push(new nlobjSearchColumn('custrecord_arin_asli_cuentahaber'));

    cuentas = nlapiSearchRecord('customrecord_arin_asli_cuentasasieliquid', null, filtros, columnas);
    
    return cuentas;
}

function comprobarPeriodoCerrado(fecha)
{
    var periodo = {};

    var filtros = new Array();
    filtros.push(new nlobjSearchFilter('startDate', null, 'onorbefore',fecha));
    filtros.push(new nlobjSearchFilter('endDate', null, 'onorafter',fecha));
    filtros.push(new nlobjSearchFilter('isQuarter', null, 'is',false));
    filtros.push(new nlobjSearchFilter('isYear', null, 'is',false));

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn('closed'));  

    periodo = nlapiSearchRecord('accountingperiod', null, filtros, columnas);

    if(periodo == null)
    {
        return null;
    }
    else
    {
        return periodo[0].getValue('closed');
    }

}
